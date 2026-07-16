# @mapsight/traffic-style

> **Package:** `@mapsight/traffic-style` · **Hub:** [Documentation index](https://github.com/open-mapsight/mapsight/blob/main/docs/README.md)

Default **icons** and **vector map styles** for [Mapsight](https://github.com/open-mapsight/mapsight) —
an OpenLayers + React framework.

**Mapsight vector style** is the styling syntax (a CSS subset compiled to
OpenLayers style functions — see
[`@mapsight/vector-style-compiler`](https://github.com/open-mapsight/mapsight/tree/main/packages/vector-style-compiler)).
**Traffic-style** is one opinionated but flexible base implementation: good defaults
for city maps and traffic applications (hence the name), and equally usable as a
starting point you can trim or extend. It covers feature selection and highlight
states, clustering, lines, dynamic parking indications, POI icons, labels, and more.

### How it fits together

Pass a compiled `styleFunction` into
[`@mapsight/ui`](https://github.com/open-mapsight/mapsight/tree/main/packages/ui)
(or `@mapsight/core`). The function is produced by `vector-style-compiler` and
wraps [`createCachedStyleFunction`](https://github.com/open-mapsight/mapsight/tree/main/packages/lib-ol)
from `@mapsight/lib-ol` — a 3-level LRU cache keyed on env, feature props,
geometry, and volatile values (e.g. async runtime icons).

Vector layers select which rules apply through **layer styles** and **env**. Each
layer's `style` option is a style name (string) or a `MapsightStyleFunctionEnv`
object, merged with map state (zoom, etc.) on every render:

```ts
import styleFunction from "@mapsight/traffic-style/default";
import {create} from "@mapsight/ui";

create(container, styleFunction, {/* layers, controllers, … */});

// Style name → matches #features in the compiled style
features("hotels", true, true, meta, "features");

// Style env → overrides env fields used in selectors like [env|mapsightIconId]
features("hotels", true, true, meta, {
	style: "features",
	mapsightIconId: "hotel",
});
```

Feature properties (`mapsightIconId`, `state`, …) and env fields drive which rules
match. Selection, clustering, zoom-dependent icons, and runtime pictograms all
flow through this pipeline.

### Related packages

| Package                                                                                                                 | Role                                                     |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [`@mapsight/ui`](https://github.com/open-mapsight/mapsight/tree/main/packages/ui)                                       | React UI, map config, layer helpers, runtime icon plugin |
| [`@mapsight/core`](https://github.com/open-mapsight/mapsight/tree/main/packages/core)                                   | Redux store, map controller, `setStyleFunction`          |
| [`@mapsight/vector-style-compiler`](https://github.com/open-mapsight/mapsight/tree/main/packages/vector-style-compiler) | Vector-style syntax → compiled `styleFunction`           |
| [`@mapsight/lib-ol`](https://github.com/open-mapsight/mapsight/tree/main/packages/lib-ol)                               | `createCachedStyleFunction`, style env types, OL helpers |

## Quick start with `@mapsight/ui`

Import the precompiled default style and pass it to `create()`:

```ts
import styleFunction from "@mapsight/traffic-style/default";
import {create} from "@mapsight/ui";

create(container, styleFunction, baseMapsightConfig);
```

Icons work out of the box: set `mapsightIconId` on features (or per-layer via
style env as above). `@mapsight/ui` browser defaults include the runtime icon
plugin; feature lists use `useMapsightIcon` automatically.

```json
{ "mapsightIconId": "museum" }
{ "mapsightIconId": "museum/#be123c" }
```

Optional Font Awesome pictograms (`fa-*` ids):

```ts
import "@mapsight/traffic-style/pictograms-fontawesome";
```

Need different colors, zoom thresholds, or style partials? See
[Customize the style](#customize-the-style) below.

Not using `@mapsight/ui`? See [ICON_INTEGRATION.md](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/docs/ICON_INTEGRATION.md).

## Customize the style

When the precompiled `default` export is not enough, compile your own entry from
traffic-style SCSS sources with `vector-style-compiler`:

```json
{
	"scripts": {
		"build:mapsightStyle": "vector-style-compiler src/vector-styles/app.scss --output src/generated/mapsight-vector-styles --name app"
	}
}
```

```ts
import styleFunction from "@/generated/mapsight-vector-styles/app";
```

Tune the style through Sass module variables (`$MAPSIGHT_TRAFFIC_STYLE__…` in
`src/scss/_variables.scss`) and pick entry partials (`base`, `full`, or
individual `features/*`). Configure variables **before** loading any traffic-style
partial — the first `@use` of `variables` applies to the whole compilation.

```scss
@use "@mapsight/traffic-style/src/scss/icons-2x" with (
	$MAPSIGHT_TRAFFIC_STYLE__SPRITE_PATH:
		"/img/mapsight-traffic-style-icon-sprite-2x.png?v=2026-01-01"
);

@use "@mapsight/traffic-style/src/scss/full";

// App-specific rules on top
#features [type="myLayer"] {
	stroke-color: #467aff;
}
```

Full variable reference, manual sprite wiring, and partial composition:
[docs/CUSTOMIZING_SCSS.md](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/docs/CUSTOMIZING_SCSS.md).

## Icon assets

The package ships ready-to-use sprites and individual PNG/SVG files under `img/`.
You can also **subset**, **extend**, or **replace** icons for your app:

| Goal                         | Approach                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use defaults as-is           | Sprite SCSS + PNG, or individual files under `img/`                                                                                                            |
| Smaller deploy               | Subset sprites/composable icons at build time (`traffic-icon-sprite`, `traffic-composable-icons`)                                                              |
| Custom sprite tiles          | `traffic-icon-sprite --overrides ./my-icons/` — swap or add PNGs, regenerate sprite SCSS                                                                       |
| Custom composable pictograms | `registerPictograms` from `@mapsight/traffic-style/pictograms`, or pre-bake with `traffic-composable-icons` + custom `meta.json`                               |
| Contribute to the catalog    | Add pictograms/sprites to this package — [docs/DEVELOPMENT.md](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/docs/DEVELOPMENT.md) |

Details and CLI examples: [docs/CUSTOM_ICON_BUILDS.md](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/docs/CUSTOM_ICON_BUILDS.md).
Catalog concepts (sprite vs composable, pictogram packs): [docs/ICON_CATALOG.md](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/docs/ICON_CATALOG.md).

## Documentation

| Doc                                                                                                                                 | What you'll find                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [docs/CUSTOMIZING_SCSS.md](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/docs/CUSTOMIZING_SCSS.md)     | Customize the style — variables, module patterns, partial composition |
| [docs/ICON_INTEGRATION.md](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/docs/ICON_INTEGRATION.md)     | Icons without `@mapsight/ui` (direct runtime API)                     |
| [docs/RUNTIME_ICONS.md](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/docs/RUNTIME_ICONS.md)           | Runtime icon architecture, caching, compiler integration              |
| [docs/ICON_CATALOG.md](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/docs/ICON_CATALOG.md)             | Sprite vs composable, `meta.json`, pictogram packs                    |
| [docs/CUSTOM_ICON_BUILDS.md](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/docs/CUSTOM_ICON_BUILDS.md) | `traffic-icon-sprite` and `traffic-composable-icons` CLIs             |
| [docs/DEVELOPMENT.md](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/docs/DEVELOPMENT.md)               | Contributing: tests, new icons, publishing                            |
