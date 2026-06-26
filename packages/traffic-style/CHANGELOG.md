# @mapsight/traffic-style

## 5.3.2

### Patch Changes

- 01bb11d: Declare MIT license in package manifests.
- Updated dependencies [01bb11d]
    - @mapsight/lib-ol@4.2.1

## 5.3.1

### Patch Changes

- 1631abc: Replace removed `bicycleCount` station type with `bicycleSensorTotal` across the OpenAPI contract, UI, showcase demo, and smart-city icon aliases.

## 5.3.0

### Minor Changes

- 38f03ad: Add icon metadata helpers, fix variant fallback, align composed default pictogram icons with the legacy bitmap footprint, add a `traffic-copy-assets` CLI for filtered deploy copies, and keep the published icon catalog split to PNG/SVG-only directories.

### Patch Changes

- dd17aa3: Bump dependencies from Dependabot ([#3](https://github.com/open-mapsight/mapsight/pull/3)).
- 7d48f25: Bump dependencies from Dependabot ([#96](https://github.com/open-mapsight/mapsight/pull/96)).
- 7296703: Preserve a feature's `mapsightIconId` when layer env icon defaults are present, unless `env.mapsightIconUse` is set to `force`.
- Updated dependencies [8cf6b58]
- Updated dependencies [9fa5b74]
    - @mapsight/lib-ol@4.2.0

## 5.2.0

### Minor Changes

- 77faf3d: Add icon metadata helpers, fix variant fallback, and align composed default pictogram icons with the legacy bitmap footprint.

## 5.1.0

### Minor Changes

- 49da00b: Add composable runtime icons: pictogram-based templates and `mapsightIconId` parsing in traffic-style (with configurable default xsmall/small icon zoom levels), async rasterization with volatile style-cache invalidation in lib-ol and vector-style-compiler, plus `useMapsightIcon` and a runtime icon style plugin in ui.
- e5c52ea: Resolve map sprite and theme icon paths from style env `imagesUrl` instead of baking `/img/` at compile time. Traffic-style sprite rules use `attr(--env-imagesUrl)` with a new `$MAPSIGHT_TRAFFIC_STYLE__SPRITE_FILE` variable; MapController gains `setDefaultStyleEnv()`; ui wires `createOptions.imagesUrl` into that default env so CMS embeds can set the icon base per deploy path without rebuilding JS.
- 74568cf: Improve traffic-style icon pipeline: add Font Awesome smart-city pictograms and default ort icons, fix sprite padding and missing default build output, unify sprite/runtime icon fallback in SCSS mixins, and resolve Sass deprecation warnings.

    ***

### Patch Changes

- Updated internal dependencies.

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
