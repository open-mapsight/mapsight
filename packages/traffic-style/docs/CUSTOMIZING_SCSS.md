# Customize the style

When the precompiled `@mapsight/traffic-style/default` export is not enough,
compile your own entry from traffic-style SCSS with `vector-style-compiler`.
This document covers Sass module variables, sprite wiring, and composing only the
partials you need.

For vector-style syntax (`icon-src`, `calc()`, zoom selectors, `env`, …), see
[`@mapsight/vector-style-compiler`](https://github.com/open-mapsight/mapsight/tree/main/packages/vector-style-compiler).

---

## Compile your own style

Typical app build:

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

Pass the result to `@mapsight/ui`'s `create()` like the precompiled default.

---

## Sass module configuration

All tunables live in `src/scss/_variables.scss`. Names are prefixed
`$MAPSIGHT_TRAFFIC_STYLE__` and use `!default`.

**Critical rule:** the **first** `@use` of the variables module in your
compilation configures it for every downstream partial. Traffic-style partials
(`base`, `full`, `features/*`, mixins) all `@use "../variables"` internally —
they share that single configured instance.

Always configure variables **before** loading any traffic-style style partial.

---

## Recommended setup (`icons-2x` shim)

`src/scss/_icons-2x.scss` loads the generated sprite map and forwards your
overrides into `variables`:

```scss
@use "@mapsight/traffic-style/src/scss/icons-2x" with (
	$MAPSIGHT_TRAFFIC_STYLE__SPRITE_PATH:
		"/img/mapsight-traffic-style-icon-sprite-2x.png?v=2026-01-01",
	$MAPSIGHT_TRAFFIC_STYLE__RUNTIME_ICONS_ENABLED: true,
	$MAPSIGHT_TRAFFIC_STYLE__FEATURES_BASE_ZOOM_DEFAULT: 14
);

@use "@mapsight/traffic-style/src/scss/full";

// Your app-specific rules
#features [type="myLayer"] {
	stroke-color: #467aff;
}
```

Use `icons-1x` when serving the 1× sprite sheet.

The shim only forwards `$MAPSIGHT_TRAFFIC_STYLE__SPRITE_PATH` and
`$MAPSIGHT_TRAFFIC_STYLE__ICONS`. For other variables (zoom thresholds, runtime
toggle, colors), use the manual pattern below so every override lands in the
single first `@use` of `variables`.

---

## Manual sprite wiring

When you need full control (custom sprite from `traffic-icon-sprite`, different
namespace, or braunschweig-style layout):

```scss
@use "./my-variables" as app;
@use "@mapsight/traffic-style/mapsight-traffic-style-icon-sprite-2x" as sprite;

@use "@mapsight/traffic-style/src/scss/variables" with (
	$MAPSIGHT_TRAFFIC_STYLE__IMAGE_PATH: app.$basePath + "img/",
	$MAPSIGHT_TRAFFIC_STYLE__SPRITE_PATH: app.$basePath +
		"img/mapsight-traffic-style-icon-sprite-2x.png?v=" + app.$version,
	$MAPSIGHT_TRAFFIC_STYLE__ICONS:
		sprite.$mapsight-traffic-style-icon-sprite-2x
);

@use "@mapsight/traffic-style/src/scss/base";
@use "@mapsight/traffic-style/src/scss/features/cluster";
```

---

## Reading variables in your own SCSS

Give the configured module a namespace and reference values in custom rules:

```scss
@use "@mapsight/traffic-style/src/scss/variables" as msVars with (
	$MAPSIGHT_TRAFFIC_STYLE__BASE_Z_INDEX: 200
);

#features [cluster] .clusterLabelFg {
	zindex: msVars.$MAPSIGHT_TRAFFIC_STYLE__BASE_Z_INDEX + 3;

	[state="highlight"] {
		zindex: msVars.$MAPSIGHT_TRAFFIC_STYLE__BASE_Z_INDEX + 5 + 3;
	}
}
```

Configure once; use the same namespace in files that load after the first
`@use` of `variables`.

---

## Style entry points

| Partial                                  | What it includes                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| `src/scss/base`                          | `_global`, `_traffic`, `_user-geolocation`, `features/_base`           |
| `src/scss/full`                          | `base` + `_traffic2`, `features/_cluster`, `features/_spread`, `_draw` |
| `src/scss/traffic`                       | Traffic sign styling (first set)                                       |
| `src/scss/traffic2`                      | Traffic sign styling (second set)                                      |
| `src/scss/features/base`                 | Icon zoom bands, labels, selection chrome                              |
| `src/scss/features/cluster`              | Cluster count labels and highlight                                     |
| `src/scss/features/spread`               | Spread / collision offset rules                                        |
| `src/scss/_draw`                         | Draw / measure tool styling                                            |
| `base.scss` / `full.scss` (package root) | `icons-2x` + `base` / `full` with package defaults                     |

Pick `base` for a slimmer bundle; add individual `features/*` or `traffic*`
partials à la carte after configuring variables.

---

## Variable reference

### Zoom and icon variants

| Variable                                              | Default         | Effect                                                 |
| ----------------------------------------------------- | --------------- | ------------------------------------------------------ |
| `$MAPSIGHT_TRAFFIC_STYLE__FEATURES_BASE_ZOOM_SMALL`   | `11`            | Below this zoom (non-highlight/select): `xsmall` icons |
| `$MAPSIGHT_TRAFFIC_STYLE__FEATURES_BASE_ZOOM_DEFAULT` | `13`            | Between small and default thresholds: `small` icons    |
| `$MAPSIGHT_TRAFFIC_STYLE__ICON_MAX_SIZE`              | `26×28`         | Upper bound for icon dimensions                        |
| `$MAPSIGHT_TRAFFIC_STYLE__ICON_DEFAULT`               | `"ort"`         | Fallback sprite id                                     |
| `$MAPSIGHT_TRAFFIC_STYLE__ICON_FALLBACK_MAP`          | parking aliases | Map unknown ids to sprite alternatives                 |
| `$MAPSIGHT_TRAFFIC_STYLE__ICON_ENABLE_FORCE_BY_ENV`   | `true`          | Allow env-driven icon overrides                        |

Variant selection for runtime icons is implemented in `features/_base.scss` using
these zoom thresholds. The compact `mapsightIconId` string does not carry variant
— see [ICON_CATALOG.md](ICON_CATALOG.md).

### Sprite assets

| Variable                                  | Default                      | Effect                                 |
| ----------------------------------------- | ---------------------------- | -------------------------------------- |
| `$MAPSIGHT_TRAFFIC_STYLE__IMAGE_PATH`     | `"img/"`                     | Base URL/path prefix for assets        |
| `$MAPSIGHT_TRAFFIC_STYLE__SPRITE_PATH`    | `$IMAGE_PATH + "sprite.png"` | Full URL to sprite PNG                 |
| `$MAPSIGHT_TRAFFIC_STYLE__ICONS`          | minimal `"ort"` tile         | Map of icon id → sprite coordinates    |
| `$MAPSIGHT_TRAFFIC_STYLE__IMG_BASE_SCALE` | `0.5`                        | OpenLayers icon scale for sprite icons |

`$MAPSIGHT_TRAFFIC_STYLE__ICONS` normally comes from the generated sprite SCSS
(`mapsight-traffic-style-icon-sprite-1x` / `-2x`).

### Runtime (composable) icons

| Variable                                         | Default | Effect                                               |
| ------------------------------------------------ | ------- | ---------------------------------------------------- |
| `$MAPSIGHT_TRAFFIC_STYLE__RUNTIME_ICONS_ENABLED` | `true`  | Emit `mapsightRuntimeIcon` rules in `features/_base` |
| `$MAPSIGHT_TRAFFIC_STYLE__RUNTIME_ICON_SCALE`    | `0.5`   | Icon scale for client-composed icons                 |

When enabled, composable `mapsightIconId` values are drawn at runtime; sprite ids
are still routed to the sheet via `auto-icon` mixins.

### Global geometry and labels

| Variable                                                  | Default                    | Effect                                        |
| --------------------------------------------------------- | -------------------------- | --------------------------------------------- |
| `$MAPSIGHT_TRAFFIC_STYLE__BASE_Z_INDEX`                   | `100`                      | Default `zIndex` on `*` selector in `_global` |
| `$MAPSIGHT_TRAFFIC_STYLE__FILL_COLOR`                     | `rgba(255, 0, 0, 0.46)`    | Default fill                                  |
| `$MAPSIGHT_TRAFFIC_STYLE__STROKE_COLOR`                   | `rgba(224, 109, 208, 0.9)` | Default stroke                                |
| `$MAPSIGHT_TRAFFIC_STYLE__TEXT_FONT`                      | `bold`                     | Default label font                            |
| `$MAPSIGHT_TRAFFIC_STYLE__TEXT_FILL_COLOR`                | `#0c6490`                  | Default label fill                            |
| `$MAPSIGHT_TRAFFIC_STYLE__TEXT_STROKE_COLOR`              | `#fff`                     | Default label stroke                          |
| `$MAPSIGHT_TRAFFIC_STYLE__TEXT_STROKE_WIDTH`              | `3`                        | Default label stroke width                    |
| `$MAPSIGHT_TRAFFIC_STYLE__STATE_DEFAULT`                  | `"default"`                | Default feature state name                    |
| `$MAPSIGHT_TRAFFIC_STYLE__FEATURE_LABEL_OFFSET_X`         | `3`                        | Feature label X offset                        |
| `$MAPSIGHT_TRAFFIC_STYLE__FEATURE_LABEL_OFFSET_Y`         | `1`                        | Feature label Y offset                        |
| `$MAPSIGHT_TRAFFIC_STYLE__FEATURE_LABEL_DEFAULT_MIN_ZOOM` | `15`                       | Min zoom for default labels                   |
| `$MAPSIGHT_TRAFFIC_STYLE__FEATURE_LABEL_DEFAULT_PREFIX`   | `""`                       | Label text prefix                             |
| `$MAPSIGHT_TRAFFIC_STYLE__FEATURE_LABEL_DEFAULT_SUFFIX`   | `""`                       | Label text suffix                             |

---

## Zero-config precompiled style

`default.scss` (compiled to `@mapsight/traffic-style/default`) bundles the 2×
sprite path and `full` style with package-relative asset URLs. Use when you do not
need SCSS customization:

```ts
import styleFunction from "@mapsight/traffic-style/default";
```

---

## Custom sprite sheets

If you build a smaller sprite with `traffic-icon-sprite`, point
`$MAPSIGHT_TRAFFIC_STYLE__ICONS` and `$MAPSIGHT_TRAFFIC_STYLE__SPRITE_PATH` at
your generated SCSS map and PNG. See [CUSTOM_ICON_BUILDS.md](CUSTOM_ICON_BUILDS.md).
