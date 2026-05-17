# Vector Style Compiler - Architecture Deep Dive

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         DEVELOPER WORKFLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Define styles in CSS subset (supports custom properties):     │
│                                                                 │
│    * { fill-color: red; }                                      │
│    #myStyle { circle-radius: 5; }                              │
│    :selected { stroke-color: green; }                          │
│    [state="hover"] { fill-color: orange; }                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              COMPILE TIME (CSS → JavaScript)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input: CSS string                                              │
│  Output: JavaScript function that renders to OL Styles         │
│                                                                 │
│  Pipeline:                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │CSS String│→ │Parse to │→ │Build    │→ │Generate │            │
│  │          │  │Rules    │  │Tree     │  │Code     │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
│                                              ↓                  │
│                                         ┌──────────────┐         │
│                                         │Wrap in       │         │
│                                         │Template:     │         │
│                                         │ import OL    │         │
│                                         │ import cache │         │
│                                         │ export fn   │         │
│                                         └──────────────┘         │
│                                              ↓                  │
│                                         Pre-compiled            │
│                                      JavaScript Module          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              RUNTIME (Features → OL Styles)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input: Feature (geometry + properties), Environment            │
│  Output: Array of OL Style objects                              │
│                                                                 │
│  For each feature:                                              │
│                                                                 │
│  1. Filter feature properties                                   │
│  2. Compute hashes (env, props, geometry type)                  │
│  3. Check 3-level LRU cache                                     │
│  4. Execute declarationFunction if cache miss                  │
│  5. Build OL Style objects                                      │
│  6. Return styles                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: CSS Parsing (cssToRules)

### Input

```css
#myStyle {
	fill-color: red;
	circle-radius: 5;
}
:selected {
	stroke-color: green;
}
[state="hover"] {
	fill-color: orange;
}
```

### Processing

```typescript
// Step 1: Parse CSS with 'css' library
const om = css.parse(content);

// Step 2: Filter out non-rule nodes (media queries, comments, etc)
const rules = om.stylesheet?.rules.filter(isRule);

// Step 3: Transform each rule using mapRule()
```

### mapRule() Details

**Input**: Single CSS rule

```
selector: "#myStyle, :selected"
declarations: [{property: "fill-color", value: "red"}, ...]
```

**Processing**:

1. **Parse selectors** via mapSelector()
    - Extract style (from `#` IDs)
    - Extract state (from `:pseudo-classes`)
    - Extract conditions (from `[attributes]`)
2. **Parse declarations** via mapDeclaration()
    - Split property name by `-` (e.g., `fill-color` → `["fill", "color"]`)
    - Parse value via mapValue() (handles `attr()`, `calc()`, `replace()`)
    - Build nested object structure
3. **Collect metadata**
    - Which style names appear
    - Which state names appear
    - Which properties are dynamic
    - Which properties reference env/props

**Output**: Array of rule objects

```typescript
{
  conditions: [
    { style: "myStyle", state: undefined, group: "default", checks: undefined },
    { style: undefined, state: "selected", group: "default", checks: "props['state']=='selected'" }
  ],
  declarations: {
    default: { fill: { color: { value: "'red'" } }, circle: { radius: { value: 5 } } }
  },
  __meta: {
    styleNames: ["myStyle"],
    stateNames: ["selected"],
    declarationNames: ["fill", "circle"],
    styleProps: [],
    stylePropExpressions: []
  }
}
```

---

## Phase 2: Tree Building (rulesToTree)

### Goal

Organize rules into a hierarchical structure for efficient runtime lookup.

### Structure

```
tree = {
  [styleName]: {
    [stateName]: {
      declarations: {...},       // Base styles (no conditions)
      children: [{               // Conditional styles
        condition: "(...)&&(...)",
        declarations: {...}
      }],
      stylePropExpressions: [...]
    }
  }
}
```

### Example

Input rules:

```
Rule 1: #point { fill-color: red; }
Rule 2: #point:hover { fill-color: orange; }
Rule 3: * { stroke: blue; }
```

Output tree:

```typescript
{
  point: {
    default: {  // No state specified
      declarations: { default: { fill: {...}, stroke: {...} } },
      children: [{
        condition: "(props['state']=='hover')",
        declarations: { default: { fill: {...} } }
      }],
      stylePropExpressions: []
    }
  },
  default: {    // No style specified (global)
    default: {
      declarations: { default: { stroke: {...} } },
      children: [],
      stylePropExpressions: []
    }
  }
}
```

### Algorithm

```typescript
function rulesToTree(rules) {
	const tree = {};

	for (const rule in rules) {
		// Determine all (style, state) combinations for this rule
		for (const condition in rule.conditions) {
			const {style, state, checks} = condition;

			// Navigate/create tree path
			tree[style] = tree[style] || {};
			tree[style][state] = tree[style][state] || {
				declarations: {},
				children: [],
				stylePropExpressions: [],
			};

			// Either merge into base declarations, or add as child condition
			if (checks) {
				tree[style][state].children.push({
					condition: checks,
					declarations: rule.declarations,
				});
			} else {
				merge(tree[style][state].declarations, rule.declarations);
			}
		}
	}

	return tree;
}
```

---

## Phase 3: Code Generation (treeToProgram)

### Goal

Generate runtime-efficient JavaScript that:

1. Uses nested switch statements for fast lookups
2. Minimizes branching
3. Pre-computes as much as possible

### Two Programs Generated

#### Program 1: declarationHashFunction (Hash Mode)

Purpose: Create cache keys

```typescript
function declarationHashFunction(env, props, envHash, geometryType, style) {
	let hash = envHash + "|" + geometryType + "|";
	const addHash = (a) => {
		hash += "," + a;
	};

	// Generated code adds hash components
	declare1++;
	addHash(declare1); // Base declaration number

	if (style === "point") {
		addHash(2); // Point-specific rules
		if (props["state"] === "hover") {
			addHash(3); // Hover-specific
		}
	}

	return hash;
}
```

**Output example**:

```
"prefix|Point|,1,2,3"
```

#### Program 2: declarationFunction (Declaration Mode)

Purpose: Return actual style declarations

```typescript
function declarationFunction(env, props, geometryType, style) {
	const declaration = {};
	const declare = (a) => merge(declaration, a);

	// Base/default state
	declare({fill: {color: {value: "'red'"}}});

	// Check conditions
	if (props["state"] === "hover") {
		declare({fill: {color: {value: "'orange'"}}});
	}

	return declaration;
}
```

### Code Structure (Switch Pattern)

For multiple styles:

```typescript
// Root level: switch on style name
switch (style) {
  case 'point':
    // Point-specific styles
    declare({circle: {...}});

    // Nested: switch on state
    switch (state) {
      case 'selected':
        declare({fill: {...}});
        break;
      case 'hover':
        declare({stroke: {...}});
        break;
    }
    break;

  case 'line':
    declare({stroke: {...}});
    // ...
    break;
}
```

### Why This Works Efficiently

1. **CPU branch prediction**: Switch statements are optimized by CPUs
2. **Early exit**: First match returns immediately
3. **No loops**: All conditions checked linearly
4. **No regex**: No pattern matching at runtime
5. **No interpretation**: Direct JavaScript execution

---

## Phase 4: Template Wrapping

### Purpose

Package generated code into a complete module with:

- OL style class imports
- Caching infrastructure
- Cache management functions

### Template Structure

```typescript
export default createCachedStyleFunction({
	constructorsMap: {
		style: Style, // OL Style class
		fill: Fill, // OL Fill class
		stroke: Stroke, // OL Stroke class
		circle: Circle, // OL Circle class
		// ...
	},

	allowedProps: ["id", "name", "state"], // Security filter
	allowedStyles: ["point", "line", "polygon"], // Available styles

	declarationHashFunction: (env, props, envHash, geometryType, style) => {
		// Generated program1
	},

	declarationFunction: (env, props, geometryType, style) => {
		// Generated program2
	},

	cacheLevel1Size: 100, // Cache for (env + geom type + props)
	cacheLevel2Size: 100, // Cache for (declarations)
	cacheLevel3Size: 100, // Cache for (OL Style objects)
});
```

---

## Selector Language Reference

### Supported Selector Types

```css
/* Universal selector (any feature) */
* { ... }

/* Style selector (ID) */
#myStyleName { ... }

/* State selector (pseudo-class) */
:selected { ... }
:highlighted { ... }

/* Props selector (attribute) */
[state="hover"] { ... }                   /* Simple equality */
[props|name="Road"] { ... }               /* Access nested props */
[geometry|type="Point"] { ... }           /* Check geometry type */
[env|zoom="5"] { ... }                    /* Access environment */
[|js="props['id'] > 100"] { ... }         /* JavaScript expression */

/* Negation */
:not([state="hover"]) { ... }
:not([geometry|type="LineString"]) { ... }

/* Combinations (space = AND) */
#myStyle [state="hover"] { ... }          /* myStyle AND state==hover */
[geometry|type="Point"] .icon { ... }     /* Geometry AND group */
```

### Property Examples

```css
/* MapBox-like custom properties */
fill-color: red;
fill-color: attr(color); /* From props['color'] */
fill-color: attr(--env-primaryColor); /* From env['primaryColor'] */

circle-radius: 5;
circle-radius: calc(zoom * 2 + 3); /* JavaScript expression */

stroke-color: replace("pattern", "X", "attr(id)"); /* String replace */

text-text: attr(--env-title); /* Dynamic text */

/* Complex nested properties */
icon-src: "path/to/icon.png";
icon-sizex: 32;
icon-sizey: 32;
icon-offsetx: attr(offsetX);
```

---

## Runtime: 3-Level Caching Strategy

### Why 3 Levels?

**Level 1: Coarse-Grain (env + geometry + props)**

- High cache reuse rate
- Fast to compute key
- Typical size: 100 entries

**Level 2: Fine-Grain (declarationHashFunction output)**

- Captures rule application
- Lower reuse, higher specificity
- Typical size: 100 entries

**Level 3: OL Object Cache**

- Reuses constructed Style objects
- Clone-on-use pattern
- Typical size: 100 entries

### Example: 10,000 features with 50 unique styles

Assuming random walk through 50 styles × 10 zoom levels:

- **L1**: 100 cache entries → ~95% hit rate
    - Only unique (env, geom, props) combos cached
    - 500 unique combos, but locality of reference keeps useful ones in cache
- **L2**: 100 cache entries → ~92% hit rate
    - Refined by actual rule matches
    - Fewer unique combinations than L1
- **L3**: 100 cache entries → ~98% hit rate
    - Clone-heavy, so most Style objects already built
    - Very fast cloning

**Cache hit flow**:

- 9,500 features: L1 hit → return from cache immediately
- 400 features: L1 miss → L2 hit → clone from L3 or construct
- 100 features: All misses → full execution

---

## Performance Characteristics

### Compile Time (CSS → Code)

- **Linear scaling**: O(n) where n = number of rules
- Bottleneck: JSON.stringify in uniqueSerialized()
- Typical: 50-200ms for 500-rule stylesheets

### Runtime Performance (Feature → OL Style)

- **Average case**: < 1μs per feature (L1 cache hit)
- **Worst case**: 50-100μs per feature (full execution)
- **Typical workload**: 80-90% L1 hits
- **Memory**: 5-10 bytes per cache entry

### Code Size

- **Ratio**: 1KB CSS → 10-50KB JavaScript
- **Scaling**: Mostly linear with rule count
- **Optimization**: Dead code not eliminated

---

## Common Pitfalls & Solutions

### Pitfall 1: Cache Thrashing

**Problem**: Not enough unique (env, geom, props) to stay in cache

**Solution**:

- Reduce frequency of env changes
- Group features by geometry type
- Pre-filter props before styling

### Pitfall 2: Large Stylesheets

**Problem**: Generated code 200+KB, slow to load

**Solution**:

- Split into multiple style functions
- Compile to Node module + lazy load
- Use destructuring in template

### Pitfall 3: Dynamic Properties

**Problem**: `attr(propName)` creates many unique declarations

**Solution**:

- Use discrete classes instead of continuous values
- Bin numeric properties (zoom levels, sizes)
- Create expression-based selectors sparingly
