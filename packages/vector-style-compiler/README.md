# Mapsight vector styles

Creates JavaScript-Code that can be used as a styleFunction in mapsight by
transforming a subset of CSS.

## How it Works

The package compiles a CSS subset into a JavaScript module providing an efficient OpenLayers `styleFunction` with built-in caching.

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
/* Universal selector (any feature) */
* { ... }

/* Style selector (ID) */
#myStyleName { ... }

/* State selector (pseudo-class) */
::selected { ... }
::highlighted { ... }

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

/* Runtime icons (async-loaded, cache-aware) */
icon-src: calc(mapsightRuntimeIcon(attr(mapsightIconId), "default"));
```

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

### Custom CSS properties

<!-- CUSTOM_CSS_PROPERTIES_DOCS: -->

#### circle-fill-color

Description:

Since version: v0.0.0

#### circle-radius

Description:

Since version: v0.0.0

#### circle-stroke-color

Description:

Since version: v0.0.0

#### circle-stroke-width

Description:

Since version: v0.0.0

#### fill-color

Description:

Since version: v0.0.0

#### icon-anchorx

Description:

Since version: v0.0.0

#### icon-anchory

Description:

Since version: v0.0.0

#### icon-offsetx

Description:

Since version: v0.0.0

#### icon-offsety

Description:

Since version: v0.0.0

#### icon-opacity

Description:

Since version: v0.0.0

#### icon-scale

Description:

Since version: v0.0.0

#### icon-sizex

Description:

Since version: v0.0.0

#### icon-sizey

Description:

Since version: v0.0.0

#### icon-snaptopixel

Description:

Since version: v0.0.0

#### icon-src

Description:

Since version: v0.0.0

#### image-circle-fill-color

Description:

Since version: v0.0.0

#### image-circle-radius

Description:

Since version: v0.0.0

#### image-type

Description:

Since version: v0.0.0

#### stroke-color

Description:

Since version: v0.0.0

#### stroke-linedash

Description:

Since version: v0.0.0

#### text-alignment

Description:

Since version: v0.0.0

#### text-fill-color

Description:

Since version: v0.0.0

#### text-font

Description:

Since version: v0.0.0

#### text-offsetx

Description:

Since version: v0.0.0

#### text-offsety

Description:

Since version: v0.0.0

#### text-placement

Description:

Since version: v0.0.0

#### text-stroke-color

Description:

Since version: v0.0.0

#### text-stroke-width

Description:

Since version: v0.0.0

#### text-testalign

Description:

Since version: v0.0.0

#### text-text

Description:

Since version: v0.0.0

#### text-textalign

Description:

Since version: v0.0.0

#### text-textbaseline

Description:

Since version: v0.0.0

#### zindex

Description:

Since version: v0.0.0

<!-- :CUSTOM_CSS_PROPERTIES_DOCS -->

#### Adding the custom properties to WebStorm/PHPStorm/IntelliJ

Go to `Settings -> Editor -> Inspections` and search for `Unknown CSS property`. Then add the following string under `Options -> Custom CSS Properties`:

<code>

<!-- CUSTOM_CSS_PROPERTIES_LIST: -->

circle-fill-color,circle-radius,circle-stroke-color,circle-stroke-width,fill-color,icon-anchorx,icon-anchory,icon-offsetx,icon-offsety,icon-opacity,icon-scale,icon-sizex,icon-sizey,icon-snaptopixel,icon-src,image-circle-fill-color,image-circle-radius,image-type,stroke-color,stroke-linedash,text-alignment,text-fill-color,text-font,text-offsetx,text-offsety,text-placement,text-stroke-color,text-stroke-width,text-testalign,text-text,text-textalign,text-textbaseline,zindex<!-- :CUSTOM_CSS_PROPERTIES_LIST -->
</code>

## Benchmarking

- `pnpm bench`
    - Runs the canonical workload simulation benchmark across `nodejs`, `chromium`, `firefox`, and `webkit` via headless Playwright.
    - Includes memory output for all engines (`nodejs` heap usage; browser memory via OS RSS sampling on the Playwright browser process using `pidusage`).
    - Browser RSS is process-level memory (not JS-heap-only), so use it for trend/comparison signals.
    - For stronger GC signal in Node, run with exposed GC:
        - `NODE_OPTIONS=--expose-gc pnpm bench`
    - You can increase run length / repeat count for more stable memory trends:
        - `BENCH_WORKLOAD_ROUNDS=30 BENCH_WORKLOAD_TICKS=500 pnpm bench`
