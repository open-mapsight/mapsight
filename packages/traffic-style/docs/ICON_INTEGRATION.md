# Icon integration without `@mapsight/ui`

How to use traffic-style icons when you are **not** on the Mapsight UI stack
(custom OpenLayers app, another framework, or minimal bundle).

With `@mapsight/ui`, runtime icons and feature-list rendering are wired
automatically — see the [README](../README.md#icons-with-mapsightui).

For catalog concepts (sprite vs composable, `meta.json`, pictogram packs), see
[ICON_CATALOG.md](ICON_CATALOG.md). For architecture and caching, see
[RUNTIME_ICONS.md](RUNTIME_ICONS.md).

---

## Feature properties

Features reference icons with a compact `mapsightIconId` string:

```json
{ "mapsightIconId": "museum" }
{ "mapsightIconId": "museum/#be123c" }
{ "mapsightIconId": "museum/#be123c/#ffffff" }
```

Format: `pictogramOrLabel[/background[/foreground]]`. Variant
(`default` / `small` / `xsmall` / `plain`) comes from zoom rules in SCSS, not
from the id string.

---

## Map style (OpenLayers)

Compile SCSS that includes `features/_base` (or `base` / `full`) with runtime
icons enabled — see [CUSTOMIZING_SCSS.md](CUSTOMIZING_SCSS.md).

The compiled style calls `mapsightRuntimeIcon` for `icon-src`. Import the runtime
module so the compiler-emitted import resolves:

```ts
import "@mapsight/traffic-style/runtime";

// style function from vector-style-compiler output
import styleFunction from "./generated/my-style";
```

`@mapsight/traffic-style/runtime` loads the default **traffic-style** pictogram
pack (~36 glyphs).

### Map re-render wiring (required)

`mapsightRuntimeIcon` returns a placeholder on first paint and resolves
asynchronously. Without a map re-render hook, icons stay invisible.

**Mapsight UI** does this via `createRuntimeIconStylePlugin` in browser defaults.

**Standalone** — register callbacks yourself:

```ts
import {
	addRuntimeIconMapRenderCallback,
	bindRuntimeIconStyleFeatureScope,
} from "@mapsight/traffic-style/runtime";

import {addStyleFeatureScopeHooks} from "@mapsight/lib-ol/style/styleFeatureScope";

bindRuntimeIconStyleFeatureScope(addStyleFeatureScopeHooks);

const remove = addRuntimeIconMapRenderCallback(() => map.render());
// on teardown: remove()
```

`bindRuntimeIconStyleFeatureScope` connects placeholder resolution to
`feature.changed()` so only affected features restyle.

---

## React / async UI (outside `@mapsight/ui`)

For lists, panels, or `<img>` tags — use the async loader (same API as
`useMapsightIcon` in `@mapsight/ui`):

```ts
import {getCachedIcon, loadIcon} from "@mapsight/traffic-style/runtime";

const cached = getCachedIcon("museum/#be123c", "plain");
const bitmap = await loadIcon("museum/#be123c", "plain");
// bitmap.dataUrl → <img src={bitmap.dataUrl} />
```

---

## Optional pictogram packs

| Pack                        | Import                                                    | Ids                           |
| --------------------------- | --------------------------------------------------------- | ----------------------------- |
| **traffic-style** (default) | via `@mapsight/traffic-style/runtime`                     | `museum`, `apotheke`, …       |
| **fontawesome** (opt-in)    | `import "@mapsight/traffic-style/pictograms-fontawesome"` | `fa-school`, `fa-hospital`, … |

Import Font Awesome once at app startup. Without it, `fa-*` ids fall back to the
default marker at runtime.

---

## Dev tooling

```ts
import {
	formatMapsightIcon,
	parseMapsightIcon,
	prewarmCatalog,
} from "@mapsight/traffic-style/runtime-dev";
```

`runtime-dev` adds parsing, formatting, cache stats, and catalog prewarm — not
needed in production map bundles.

---

## Disable runtime icons

Set `$MAPSIGHT_TRAFFIC_STYLE__RUNTIME_ICONS_ENABLED: false` in the **first**
`@use` of `variables` (together with sprite settings). The `icons-2x` shim only
forwards sprite path variables — use the manual pattern from
[CUSTOMIZING_SCSS.md](CUSTOMIZING_SCSS.md) when toggling runtime icons.

Composable catalog icons will not render on the map; sprite `auto-icon` rules still
apply.

---

## Direct API reference

| Import path                           | Use                                                               |
| ------------------------------------- | ----------------------------------------------------------------- |
| `@mapsight/traffic-style/runtime`     | `mapsightRuntimeIcon`, `loadIcon`, `getCachedIcon`, map callbacks |
| `@mapsight/traffic-style/runtime-dev` | Parse/format ids, prewarm, cache stats                            |
| `@mapsight/traffic-style/icon`        | Icon formation pipeline only (no map wiring)                      |
| `@mapsight/traffic-style/icon-style`  | Direct `mapsightRuntimeIcon` (compiler alias)                     |
| `@mapsight/traffic-style/icon-meta`   | `isComposableIcon`, sprite metadata                               |
