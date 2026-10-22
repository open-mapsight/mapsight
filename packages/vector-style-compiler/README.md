# Mapsight vector styles

> **Package:** `@mapsight/vector-style-compiler` · **Hub:
> ** [Documentation index](https://github.com/open-mapsight/mapsight/blob/main/docs/README.md)

Creates JavaScript code that can be used as a `styleFunction` in Mapsight by
transforming a subset of CSS.

**Deep dive:
** [ARCHITECTURE_DEEP_DIVE.md](https://github.com/open-mapsight/mapsight/blob/main/packages/vector-style-compiler/docs/ARCHITECTURE_DEEP_DIVE.md) ·
**Consumer:** [
`@mapsight/traffic-style`](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/README.md), [
`@mapsight/core`](https://github.com/open-mapsight/mapsight/blob/main/packages/core/README.md)

## How it Works

The package compiles a CSS subset into a JavaScript module providing an efficient OpenLayers `styleFunction` with
built-in caching.

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
│  2. Compute hashes (env, props, geometry type, volatile calcs)  │
│  3. Check 3-level LRU cache                                     │
│  4. Execute declarationFunction if cache miss                  │
│  5. Build OL Style objects                                      │
│  6. Return styles                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Supported CSS Syntax

### Supported Selector Types

```css
/* @formatter:off */
/* Universal selector (any feature) */
* { ... }

/* Style selector (ID) */
#myStyleName { ... }

/* State selector (pseudo-class) */
:selected { ... }
:highlighted { ... }

/* Props selector (attribute) */
[state="hover"] { ... }                      /* simple equality */
[props|name="Road"] { ... }                  /* nested props path */
[prop|stroke-width="2"] { ... }              /* literal props key */
[env|zoom="5"] { ... }                       /* nested env path */
[env-prop|primaryColor="1"] { ... }          /* literal env key */
[geometry|type="Point"] { ... }              /* geometry type */
[|js="props['id'] > 100"] { ... }            /* JavaScript expression */

/* Negation */
:not([state="hover"]) { ... }
:not([geometry|type="LineString"]) { ... }

/* Combinations (space = AND) */
#myStyle [state="hover"] { ... }
[geometry|type="Point"] .icon { ... }
/* @formatter:on */
```

### Feature property paths

Mapsight resolves **feature properties** (`props`) and **style environment** (`env`) separately from
**style declaration names** (custom CSS properties such as `stroke-width:` on the left-hand side of
a rule).

Unquoted kebab-case in selectors and `attr()` arguments is split on `-` into **nested paths**
(accessed with optional chaining in generated code):

| Syntax               | Reads                      |
| -------------------- | -------------------------- |
| `attr(stroke-width)` | `props.stroke?.width`      |
| `[stroke-width="2"]` | `props.stroke?.width == 2` |
| `attr(path-to-test)` | `props.path?.to?.test`     |

That differs from GeoJSON keys such as Simplestyle's flat `"stroke-width"` property. Use a **literal
key** form when the feature property name contains hyphens but is not nested:

- **Nested props path** — selector: `[stroke-width="2"]`, value: `attr(stroke-width)` →
  `props.stroke?.width`
- **Literal props key** — selector: `[prop|stroke-width="2"]`, value: `attr("prop|stroke-width")` or
  `attr('stroke-width')` → `props['stroke-width']`
- **Nested env path** — selector: `[env|zoom="10"]`, value: `attr(--env-zoom)` → `env.zoom`
- **Literal env key** — selector: `[env-prop|stroke-width="2"]`, value:
  `attr("env-prop|stroke-width")` or `attr(--env-'stroke-width')` → `env['stroke-width']`

Literal selector prefixes register the key in `allowedProps` and style-cache hashing. Prefer
`prop|` / `env-prop|` over `|js` for property checks.

**Style declaration names** (left-hand side) always use hyphen nesting for the OpenLayers style
object — `stroke-width: 2` compiles to `{ stroke: { width: 2 } }` regardless of how feature props
are read on the right-hand side.

#### SCSS / Sass notes

The CLI compiles `.scss` before the style compiler. Keep these constraints in mind:

- **Quote `attr()` arguments that contain `|`** — Sass treats `|` specially inside function calls:
  `attr("prop|stroke-width")`, not `attr(prop|stroke-width)`.
- **Use `env-prop|`, not `env|prop|`** — only one `|` is valid in Sass attribute selectors; chained
  pipes fail SCSS compilation.
- **Selector prefixes work unquoted in SCSS** — `[prop|stroke-width]` and `[env-prop|zoom]` are fine.
- **Quoted selector attribute names** (`['stroke-width']`) are not valid Sass; use `[prop|stroke-width]`
  instead.

Example (Simplestyle-style flat keys):

```scss
/* @formatter:off */
#features {
	[prop|stroke-width] {
		stroke-width: attr("prop|stroke-width");
	}

	[prop|stroke-opacity] {
		stroke-opacity: attr("prop|stroke-opacity");
	}
}
/* @formatter:on */
```

### Property Examples

<!-- markdownlint-disable MD013 -->

```css
/* @formatter:off */
/* MapBox-like custom properties */
fill-color: red;
fill-color: attr(color); /* props['color'] */
fill-color: attr(--env-primaryColor); /* env['primaryColor'] */
stroke-width: attr(
	"prop|stroke-width"
); /* props['stroke-width'] — quote in SCSS */

circle-radius: 5;
circle-radius: calc(zoom * 2 + 3); /* JavaScript expression */

stroke-color: replace("pattern", "X", "attr(id)"); /* string replace */

text-text: attr(--env-title); /* dynamic text */
text-text: attr("env-prop|title"); /* literal env key — quote in SCSS */

/* Complex nested properties */
icon-src: "path/to/icon.png";
icon-sizex: 32;
icon-sizey: 32;
icon-offsetx: attr(offsetX);

/* Runtime icons (async-loaded, cache-aware) */
icon-src: calc(mapsightRuntimeIcon(attr(mapsightIconId), "default"));
/* @formatter:on */
```

<!-- markdownlint-enable MD013 -->

See full list of supported properties in [Custom CSS properties](#custom-css-properties).

### Volatile `calc()` helpers

Some `calc()` expressions call helpers whose return value can change without
feature props or map env changing — for example runtime icons that return a
placeholder synchronously and resolve to a real data URL asynchronously.

The compiler detects registered volatile helpers (currently
`mapsightRuntimeIcon`) and emits a
`volatileHashFunction` alongside the usual `declarationHashFunction` and
`declarationFunction`. When a stylesheet has no volatile calcs, the function
body is empty and always returns `createHash([])`.

At runtime, the volatile hash is folded into the **L1 cache key**. When an
icon finishes loading, only features whose resolved icon URL changed get a
cache miss and are restyled — not the entire map.

Volatile helpers must stay synchronous from the style function's perspective
(they may schedule async work internally, but must return a string immediately).
Pair them with a map re-render callback when the async result is ready.

### Derived geometries

A style group can draw on a geometry derived from the feature's own with
`geometry`. Point derivations place icons or labels along lines and polygon
rings: `vertices`, `firstVertex`, `lastVertex`, `segmentStarts`,
`segmentEnds`, `intermediateSegmentStarts` and `intermediateSegmentEnds`
(rotated along the segment).

`extrusionRoof`, `extrusionLitWalls` and `extrusionShadedWalls` draw polygons
as pseudo-3D blocks seen slightly from the south: the roof is the footprint
moved north by `extrusion-height` map units, and the south-, east- and
west-facing walls connect it to the footprint. With light from the north-west,
west-facing walls are lit and the others shaded. Points and lines keep their
own geometry as roof and get no walls, and so does `extrusion-height: 0`.

```scss
/* @formatter:off */
[kind="stall"] {
	geometry: extrusionRoof;
	extrusion-height: 1.2;
	fill-color: attr(fill);

	/* Each wall: the stall's colour, darkened by a translucent layer */
	.wall-shaded,
	.wall-shaded-tint {
		geometry: extrusionShadedWalls;
		extrusion-height: 1.2;
		fill-color: attr(fill);
	}

	.wall-shaded-tint {
		fill-color: rgba(0, 0, 0, 0.4);
	}
}
/* @formatter:on */
```

## Caching

High-level 3-level LRU caching strategy:

- **Level 1 (Coarse)**: env + volatile calc values + geometry type + props (~95% hit, size 100)
- **Level 2 (Fine)**: declaration hashes (~92% hit, size 100)
- **Level 3**: OL Style objects (clone, ~98% hit, size 100)

L1 stores fully materialized styles. Volatile calcs (see above) are hashed
separately so async value changes invalidate only the affected features.

**Example** (10k features, 50 styles, 10 zooms):

- 9500 L1 hits: instant
- 400 L1 miss → L2 hit: fast clone/construct
- 100 full execution

Average <1μs/feature, configurable sizes.

## Docs

#### IDE metadata

The package ships generated IDE metadata for Mapsight vector styles:

- `dist/mapsight-vector-style.css-data.json` for VS Code-compatible CSS custom
  data.
- `dist/mapsight-vector-style.web-types.json` for JetBrains Web Types.

JetBrains IDEs can discover the Web Types metadata automatically through the
package's `web-types` field once the package is installed.

VS Code users can reference the CSS custom data file from workspace settings:

```json
{
	"css.customData": [
		"./node_modules/@mapsight/vector-style-compiler/dist/mapsight-vector-style.css-data.json"
	],
	"scss.customData": [
		"./node_modules/@mapsight/vector-style-compiler/dist/mapsight-vector-style.css-data.json"
	]
}
```

Maintainers working on the generated metadata can use
[IDE_SUPPORT.md](https://github.com/open-mapsight/mapsight/blob/main/packages/vector-style-compiler/docs/IDE_SUPPORT.md)
for implementation notes.

#### JetBrains manual fallback

Web Types should be preferred. If a JetBrains IDE does not discover the package
metadata, go to `Settings -> Editor -> Inspections`, search for `Unknown CSS
property`, and add the following string under `Options -> Custom CSS Properties`:

<code>

<!-- CUSTOM_CSS_PROPERTIES_LIST: -->

circle-fill-color,circle-radius,circle-stroke-color,circle-stroke-width,extrusion-height,fill-color,geometry,icon-anchorx,icon-anchory,icon-offsetx,icon-offsety,icon-opacity,icon-scale,icon-sizex,icon-sizey,icon-snaptopixel,icon-src,image-circle-fill-color,image-circle-radius,image-type,stroke-color,stroke-linedash,text-alignment,text-fill-color,text-font,text-offsetx,text-offsety,text-placement,text-stroke-color,text-stroke-width,text-testalign,text-text,text-textalign,text-textbaseline,zindex<!-- :CUSTOM_CSS_PROPERTIES_LIST -->
</code>

## Benchmarking

- `pnpm bench`
    - Runs the canonical workload simulation benchmark across `nodejs`, `chromium`, `firefox`, and `webkit` via headless
      Playwright.
    - Includes memory output for all engines (`nodejs` heap usage; browser memory via OS RSS sampling on the Playwright
      browser process using `pidusage`).
    - Browser RSS is process-level memory (not JS-heap-only), so use it for trend/comparison signals.
    - For stronger GC signal in Node, run with exposed GC:
        - `NODE_OPTIONS=--expose-gc pnpm bench`
    - You can increase run length / repeat count for more stable memory trends:
        - `BENCH_WORKLOAD_ROUNDS=30 BENCH_WORKLOAD_TICKS=500 pnpm bench`

### Custom CSS properties

<!-- CUSTOM_CSS_PROPERTIES_DOCS: -->

#### circle-fill-color

Description: Fill color for circle point symbols. Accepts OpenLayers color values such as CSS color strings, RGBA arrays, gradients, patterns, or null.

Since version: v0.0.0

#### circle-radius

Description: Radius in pixels for circle point symbols. OpenLayers requires a radius to render a Circle image style.

Since version: v0.0.0

#### circle-stroke-color

Description: Stroke color for the outline of circle point symbols. Accepts OpenLayers stroke color values.

Since version: v0.0.0

#### circle-stroke-width

Description: Stroke width in pixels for the outline of circle point symbols.

Since version: v0.0.0

#### extrusion-height

Description: Height in map units for the extrusion geometry derivations (extrusionRoof, extrusionLitWalls, extrusionShadedWalls): the roof is drawn this far north of the footprint. 0 draws the footprint flat without walls.

Since version: v13.1.0

#### fill-color

Description: Fill color for polygon interiors. Accepts OpenLayers color values such as CSS color strings, RGBA arrays, gradients, patterns, or null.

Since version: v0.0.0

#### geometry

Description: Draws this style group on a geometry derived from the feature's: vertices, firstVertex, lastVertex, segmentStarts, segmentEnds (and their intermediate variants) as points, or extrusionRoof, extrusionLitWalls and extrusionShadedWalls for pseudo-3D blocks of polygons (see extrusion-height).

Since version: v0.0.0

#### icon-anchorx

Description: Horizontal icon anchor. The anchor defaults to the icon center; numeric Mapsight values are passed to OpenLayers icon anchor handling.

Since version: v0.0.0

#### icon-anchory

Description: Vertical icon anchor. The anchor defaults to the icon center; numeric Mapsight values are passed to OpenLayers icon anchor handling.

Since version: v0.0.0

#### icon-offsetx

Description: Horizontal sprite offset in pixels. Used with icon size to select a sub-rectangle from the source image.

Since version: v0.0.0

#### icon-offsety

Description: Vertical sprite offset in pixels. Used with icon size to select a sub-rectangle from the source image.

Since version: v0.0.0

#### icon-opacity

Description: Icon opacity from 0 to 1.

Since version: v0.0.0

#### icon-scale

Description: Icon scale factor. OpenLayers accepts a single number or a two-dimensional scale; do not combine absolute icon width/height with scale.

Since version: v0.0.0

#### icon-sizex

Description: Width in pixels of the icon image or sprite sub-rectangle selected from the source image.

Since version: v0.0.0

#### icon-sizey

Description: Height in pixels of the icon image or sprite sub-rectangle selected from the source image.

Since version: v0.0.0

#### icon-snaptopixel

Description: Whether icon rendering should align to device pixels where supported by the OpenLayers image style renderer.

Since version: v0.0.0

#### icon-src

Description: Image URL used for icon point symbols. OpenLayers requires a source image or loaded image to render an Icon style.

Since version: v0.0.0

#### image-circle-fill-color

Description: Fill color for a circle image symbol nested under the style image property.

Since version: v0.0.0

#### image-circle-radius

Description: Radius in pixels for a circle image symbol nested under the style image property.

Since version: v0.0.0

#### image-type

Description: Mapsight image symbolizer selector. Use it to choose the OpenLayers image style kind, such as a circle or icon, for point rendering.

Since version: v0.0.0

#### stroke-color

Description: Stroke color for line strings and polygon boundaries. Accepts OpenLayers color, gradient, or pattern values.

Since version: v0.0.0

#### stroke-linedash

Description: Line dash pattern for strokes: an array of numbers specifying alternating drawn segment and gap lengths.

Since version: v0.0.0

#### text-alignment

Description: Mapsight text alignment helper for label placement. Prefer text-textAlign when mapping directly to OpenLayers Text textAlign.

Since version: v0.0.0

#### text-fill-color

Description: Fill color for label text. OpenLayers uses a dark default fill (#333) when no text fill is provided; use null for no fill.

Since version: v0.0.0

#### text-font

Description: CSS font string for labels, as accepted by CanvasRenderingContext2D.font. OpenLayers defaults to '10px sans-serif'.

Since version: v0.0.0

#### text-offsetx

Description: Horizontal label offset in pixels. OpenLayers defaults to 0.

Since version: v0.0.0

#### text-offsety

Description: Vertical label offset in pixels. OpenLayers defaults to 0.

Since version: v0.0.0

#### text-placement

Description: Label placement mode. Use 'point' for point placement or 'line' to render text along line geometry.

Since version: v0.0.0

#### text-stroke-color

Description: Stroke color for label outlines. Useful for improving text contrast over map content.

Since version: v0.0.0

#### text-stroke-width

Description: Stroke width in pixels for label outlines.

Since version: v0.0.0

#### text-testalign

Description: Legacy or misspelled Mapsight text alignment property. Prefer text-textAlign.

Since version: v0.0.0

#### text-text

Description: Label text content. OpenLayers accepts plain strings with line breaks or rich text arrays; Mapsight values can also be dynamic via attr(...).

Since version: v0.0.0

#### text-textalign

Description: Horizontal label alignment. OpenLayers supports 'left', 'right', 'center', 'end', and 'start'.

Since version: v0.0.0

#### text-textbaseline

Description: Vertical label baseline. OpenLayers supports 'bottom', 'top', 'middle', 'alphabetic', 'hanging', and 'ideographic'.

Since version: v0.0.0

#### zindex

Description: Z index for this style. OpenLayers uses it to order style rendering; higher values draw above lower values.

Since version: v0.0.0

<!-- :CUSTOM_CSS_PROPERTIES_DOCS -->

#### Adding the custom properties to WebStorm/PHPStorm/IntelliJ

Go to `Settings -> Editor -> Inspections` and search for `Unknown CSS property`. Then add the following string under
`Options -> Custom CSS Properties`:

<code>

<!-- CUSTOM_CSS_PROPERTIES_LIST: -->

circle-fill-color,circle-radius,circle-stroke-color,circle-stroke-width,extrusion-height,fill-color,geometry,icon-anchorx,icon-anchory,icon-offsetx,icon-offsety,icon-opacity,icon-scale,icon-sizex,icon-sizey,icon-snaptopixel,icon-src,image-circle-fill-color,image-circle-radius,image-type,stroke-color,stroke-linedash,text-alignment,text-fill-color,text-font,text-offsetx,text-offsety,text-placement,text-stroke-color,text-stroke-width,text-testalign,text-text,text-textalign,text-textbaseline,zindex<!-- :CUSTOM_CSS_PROPERTIES_LIST -->
</code>

## Benchmarking

- `pnpm bench`
    - Runs the canonical workload simulation benchmark across `nodejs`, `chromium`, `firefox`, and `webkit` via headless
      Playwright.
    - Includes memory output for all engines (`nodejs` heap usage; browser memory via OS RSS sampling on the Playwright
      browser process using `pidusage`).
    - Browser RSS is process-level memory (not JS-heap-only), so use it for trend/comparison signals.
    - For stronger GC signal in Node, run with exposed GC:
        - `NODE_OPTIONS=--expose-gc pnpm bench`
    - You can increase run length / repeat count for more stable memory trends:
        - `BENCH_WORKLOAD_ROUNDS=30 BENCH_WORKLOAD_TICKS=500 pnpm bench`
