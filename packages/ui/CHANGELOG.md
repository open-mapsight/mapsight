# @mapsight/ui

## 7.4.1

### Patch Changes

- 553337a: Fix FeatureList `itemAs` wrapper behaviour and `getPath` defaultValue so host list items (overrideListHtml) render again. Document the host contract and add regression tests.
- 8fe2421: Restore `.ms3-map-overlay-combined-buttons__button` wrappers around CombinedButtons children so host CSS can share a single 1px edge between zoom +/- (and similar stacked overlay controls).
- dcd6ae1: Remember document scroll at list-item pointerdown so mapOnly selection restores the pre-click list position.
- dcd6ae1: Restore select/deselect interaction props on FeatureListItem when `overrideListHtml` short-circuits past FeatureSelectButton, and migrate FeatureSelectButton / useSelectFeature to TypeScript.
- Updated dependencies [`553337a`]:
    - `@mapsight/lib-js@3.0.6 → 3.0.7` (patch)

## 7.4.0

### Minor Changes

- c58c407: Restore legacy embed bag helpers and host entry aliases (createEmbedBag, default plugins / hook sugar, filterFeatures, withKeyboard, global-event-hub, is-numeric) so pre-OSS CMS hosts can migrate with smaller diffs.
- 1710d90: Restore additional pre-OSS host runtime compatibility (controller `globalState` reduce arg, layout slot wiring, presentational list toggle, style-env merge) and mark those legacy surfaces `@deprecated` for removal in the next major of each package.

### Patch Changes

- 65ce23a: Isolate FeatureList selection/highlight updates so only affected list items re-render
- Updated dependencies [`d0334aa`, `3539440`, `cb180eb`, `0b2f8a8`, `c58c407`, `1710d90`]:
    - `@mapsight/traffic-style@5.3.2 → 5.4.0` (minor)
    - `@mapsight/core@14.4.2 → 14.5.0` (minor)
    - `@mapsight/lib-ol@4.2.1 → 4.2.2` (patch)
    - `@mapsight/lib-js@3.0.5 → 3.0.6` (patch)

## 7.3.2

### Patch Changes

- 01bb11d: Declare MIT license in package manifests.
- Updated dependencies [01bb11d]
    - @mapsight/core@14.4.2
    - @mapsight/lib-js@3.0.5
    - @mapsight/lib-ol@4.2.1
    - @mapsight/lib-redux@2.2.2
    - @mapsight/traffic-style@5.3.2

## 7.3.1

### Patch Changes

- 68d687a: Stop xhr-json feature source autoload loops on HTTP errors with empty status text (for example 404 during partial deploys).
- Updated dependencies [1631abc]
- Updated dependencies [68d687a]
    - @mapsight/traffic-style@5.3.1
    - @mapsight/core@14.4.1

## 7.3.0

### Minor Changes

- 5743b4a: Add async status components and feature list loading/error/empty states. Export `@mapsight/ui/async-status`.
- 5743b4a: Add TanStack Query adapter subpath, migrate search results and feature details loading UI to shared async status components.
- b7d0ece: Add optional geolocation distance labels for feature list items. Export `DistanceLabel`, wire via `itemDistanceLabelAs` / `distanceLabelAs` (default off), and style opted-in rows with `ms3-list__main--with-distance` in the 2022-03 theme.
- 0acda06: Add optional `listDefaultSortingByFeatureSource` UI state and `effectiveListSortingSelector` for per-feature-source default list sorting. Existing apps keep current behavior until they configure defaults; explicit user sorting still wins.
- b755930: Add optional search icon styling for `QueryInputWithLabel` via `$ms3-option-queryInputWithLabelSearchIcon` (default `false`). Styles live in the block partial and are omitted at compile time when the option is off.

### Patch Changes

- 5743b4a: Export async status components subpath and migrate count-aggregator-ui loading states to shared QueryStatusRegion and AsyncStatusRegion.
- 7d48f25: Bump dependencies from Dependabot ([#96](https://github.com/open-mapsight/mapsight/pull/96)).
- f16212e: TypeScript: migrate the feature-list-item cluster (`index`, `head`, scroll hook) and add shared list-item handler types.
- b919f0b: Skip desktop overlay dismiss handling when the layer switcher is shown in the mobile modal.
- ee1ed8c: Export the shared i18n helper entrypoint for apps.
- Updated dependencies [b8b31e2]
- Updated dependencies [8cf6b58]
- Updated dependencies [dd17aa3]
- Updated dependencies [7d48f25]
- Updated dependencies [7296703]
- Updated dependencies [9fa5b74]
- Updated dependencies [38f03ad]
    - @mapsight/core@14.4.0
    - @mapsight/lib-ol@4.2.0
    - @mapsight/traffic-style@5.3.0

## 7.2.1

### Patch Changes

- 25c5f29: Stop initializing runtime-only feature source state in UI feature source config
  helpers.

    The helpers now return only feature source configuration fields and rely on the
    core runtime state normalization introduced in
    https://github.com/open-mapsight/mapsight/commit/6cd6e11ffe73633eeb55f8e02425748baefe385d
    to populate `data`, `lastUpdate`, and `lastActionType`.

- 25c5f29: Add more flexible layer switcher presentation options.

    Layer switchers can now render base layers in their own section while keeping
    overlay layers grouped separately, with base layer entries isolated from feature
    source updates. Feature lists can also render the external layer switcher behind
    a compact filter-toggle control.

    The default layer switcher CSS stays intentionally minimal; the richer split
    layout sizing, spacing, and expanded overlay dimensions live in the existing
    `2022-03` theme.

- Updated dependencies [6cd6e11]
- Updated dependencies [77faf3d]
    - @mapsight/core@14.3.0
    - @mapsight/traffic-style@5.2.0

## 7.2.0

### Minor Changes

- 49da00b: Add combined feature sources that merge features from multiple member sources, and a `combinedVisibleLayers` plugin that keeps a combined source in sync with whichever member map layers are currently visible.
- 49da00b: Add composable runtime icons: pictogram-based templates and `mapsightIconId` parsing in traffic-style (with configurable default xsmall/small icon zoom levels), async rasterization with volatile style-cache invalidation in lib-ol and vector-style-compiler, plus `useMapsightIcon` and a runtime icon style plugin in ui.
- 49da00b: Add Zod-based Mapsight config validation: core exports `createMapsightConfigSchema`, `validateConfig`, and per-domain schemas for map, layers, feature sources, and filters; ui validates config on startup (warn in development, optional strict mode in production).
- 49da00b: Migrate to Redux Toolkit 2, Redux 5, react-redux 9, and reselect 5; replace `createStructuredSelector` usage, prefer `@reduxjs/toolkit` exports, and update the vector-editor browser renderer to React 18 `createRoot`.
- 8d3ccfc: Add `getGeoJsonFeatureSortAnchor` in lib-ol and use it for distance sorting in the feature list. TypeScriptify list components, add tag-switcher and filter toggle controls, extract `MapsightIcon`, and fix a feature-source autoload loop.

    ***

### Patch Changes

- 49da00b: Add `@mapsight/ui/embed/*` package exports for embed entry points.
- e5c52ea: Resolve map sprite and theme icon paths from style env `imagesUrl` instead of baking `/img/` at compile time. Traffic-style sprite rules use `attr(--env-imagesUrl)` with a new `$MAPSIGHT_TRAFFIC_STYLE__SPRITE_FILE` variable; MapController gains `setDefaultStyleEnv()`; ui wires `createOptions.imagesUrl` into that default env so CMS embeds can set the icon base per deploy path without rebuilding JS.
- 74568cf: Improve traffic-style icon pipeline: add Font Awesome smart-city pictograms and default ort icons, fix sprite padding and missing default build output, unify sprite/runtime icon fallback in SCSS mixins, and resolve Sass deprecation warnings.

    ***

- 1e0651c: Publish `src/scss` in the npm tarball so integrators can `@use` Mapsight UI SCSS entry points (host starters, Next/SPA shells) after `npm install`.
- Updated internal dependencies.

## 7.1.0

### Minor Changes

- 5eede53: Prepare to move to redux toolkit, cleanup types, cleanup code

### Patch Changes

- Updated dependencies [5eede53]
    - @mapsight/lib-redux@2.1.0
    - @mapsight/core@14.1.0

## 7.0.3

### Patch Changes

- 744e584: Full release of all packages (now with github releases too?)
- Updated dependencies [744e584]
    - @mapsight/lib-redux@2.0.3
    - @mapsight/lib-js@3.0.3
    - @mapsight/lib-ol@4.0.3
    - @mapsight/core@14.0.3

## 7.0.2

### Patch Changes

- d4ec483: Full release with CI (try 2)
- Updated dependencies [d4ec483]
    - @mapsight/core@14.0.2
    - @mapsight/lib-js@3.0.2
    - @mapsight/lib-ol@4.0.2
    - @mapsight/lib-redux@2.0.2

## 7.0.1

### Patch Changes

- fdd3c3a: Full release of all packages via CI
- Updated dependencies [fdd3c3a]
    - @mapsight/core@14.0.1
    - @mapsight/lib-js@3.0.1
    - @mapsight/lib-ol@4.0.1
    - @mapsight/lib-redux@2.0.1
