# @mapsight/traffic-style

## 5.1.0

### Minor Changes

- 49da00b: Add composable runtime icons: pictogram-based templates and `mapsightIconId` parsing in traffic-style (with configurable default xsmall/small icon zoom levels), async rasterization with volatile style-cache invalidation in lib-ol and vector-style-compiler, plus `useMapsightIcon` and a runtime icon style plugin in ui.
- e5c52ea: Resolve map sprite and theme icon paths from style env `imagesUrl` instead of baking `/img/` at compile time. Traffic-style sprite rules use `attr(--env-imagesUrl)` with a new `$MAPSIGHT_TRAFFIC_STYLE__SPRITE_FILE` variable; MapController gains `setDefaultStyleEnv()`; ui wires `createOptions.imagesUrl` into that default env so CMS embeds can set the icon base per deploy path without rebuilding JS.
- 74568cf: Improve traffic-style icon pipeline: add Font Awesome smart-city pictograms and default ort icons, fix sprite padding and missing default build output, unify sprite/runtime icon fallback in SCSS mixins, and resolve Sass deprecation warnings.

    ***

### Patch Changes

- Updated dependencies [49da00b]
- Updated dependencies [8d3ccfc]
    - @mapsight/lib-ol@4.1.0

## 5.0.6

### Patch Changes

- 744e584: Full release of all packages (now with github releases too?)
- Updated dependencies [744e584]
    - @mapsight/lib-ol@4.0.3

## 5.0.5

### Patch Changes

- d4ec483: Full release with CI (try 2)
- Updated dependencies [d4ec483]
    - @mapsight/lib-ol@4.0.2

## 5.0.4

### Patch Changes

- fdd3c3a: Full release of all packages via CI
- Updated dependencies [fdd3c3a]
    - @mapsight/lib-ol@4.0.1
