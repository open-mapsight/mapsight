# @mapsight/core

## 14.2.0

### Minor Changes

- 49da00b: Add combined feature sources that merge features from multiple member sources, and a `combinedVisibleLayers` plugin that keeps a combined source in sync with whichever member map layers are currently visible.
- 49da00b: Add Zod-based Mapsight config validation: core exports `createMapsightConfigSchema`, `validateConfig`, and per-domain schemas for map, layers, feature sources, and filters; ui validates config on startup (warn in development, optional strict mode in production).
- 49da00b: Migrate to Redux Toolkit 2, Redux 5, react-redux 9, and reselect 5; replace `createStructuredSelector` usage, prefer `@reduxjs/toolkit` exports, and update the vector-editor browser renderer to React 18 `createRoot`.
- e5c52ea: Resolve map sprite and theme icon paths from style env `imagesUrl` instead of baking `/img/` at compile time. Traffic-style sprite rules use `attr(--env-imagesUrl)` with a new `$MAPSIGHT_TRAFFIC_STYLE__SPRITE_FILE` variable; MapController gains `setDefaultStyleEnv()`; ui wires `createOptions.imagesUrl` into that default env so CMS embeds can set the icon base per deploy path without rebuilding JS.

### Patch Changes

- 1e0651c: Add default export conditions for public subpaths so browser bundlers can resolve the packed package consistently.
- 8d3ccfc: Do not immediately retry a feature source load after failure; wait for the next explicit load trigger instead.

    ***

- 49da00b: Fix feature highlight race conditions, export `FeatureInteractionNames`, add optional `compare` to `BaseController.getAndObserveUncontrolled`, and mark noisy OpenLayers feedback dispatches with `quiet()`.
- Updated dependencies [49da00b]
- Updated dependencies [49da00b]
- Updated dependencies [8d3ccfc]
- Updated dependencies [49da00b]
    - @mapsight/lib-ol@4.1.0
    - @mapsight/lib-redux@2.2.0
    - @mapsight/lib-js@3.0.4

## 14.1.0

### Minor Changes

- 5eede53: Prepare to move to redux toolkit, cleanup types, cleanup code

### Patch Changes

- Updated dependencies [5eede53]
    - @mapsight/lib-redux@2.1.0

## 14.0.3

### Patch Changes

- 744e584: Full release of all packages (now with github releases too?)
- Updated dependencies [744e584]
    - @mapsight/lib-redux@2.0.3
    - @mapsight/lib-js@3.0.3
    - @mapsight/lib-ol@4.0.3

## 14.0.2

### Patch Changes

- d4ec483: Full release with CI (try 2)
- Updated dependencies [d4ec483]
    - @mapsight/lib-js@3.0.2
    - @mapsight/lib-ol@4.0.2
    - @mapsight/lib-redux@2.0.2

## 14.0.1

### Patch Changes

- fdd3c3a: Full release of all packages via CI
- Updated dependencies [fdd3c3a]
    - @mapsight/lib-js@3.0.1
    - @mapsight/lib-ol@4.0.1
    - @mapsight/lib-redux@2.0.1
