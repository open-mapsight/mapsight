# @mapsight/core

## 14.6.8

### Patch Changes

- ab13ef7: Reuse combined feature-source results while member feature arrays are unchanged, avoiding array copies and deep observer comparisons during map interactions. Build changed combinations in a single pass.
- 2270229: Keep the filtered feature source selector's result stable while neither the source state nor its filter values change. The featuresKey fast path rebuilt the result on every call, so every `SharedReadonlyVectorFeatureSource` (and list) subscriber ran on every Redux dispatch and fingerprinted all features of its source again; with a few thousand features that cost 10–100 ms per dispatch and dropped pinch zoom on mid-range phones to ~25 fps. `SharedReadonlyVectorFeatureSource` also skips the fingerprint when only collection metadata changed and the features array is the same.
- eed3ab3: Keep integrated and external layer-switcher id arrays stable across map view updates and layer changes that leave switcher membership and order unchanged. Memoize filtering from the layers state instead of allocating arrays in input selectors, avoiding unnecessary renders in layer switchers.
- 374a3e4: Use the native TypeScript 7 compiler for typechecks and library builds while preserving the TypeScript 6 API for existing tools and the UI's public React prop declarations.
- 2d13e3d: Validate immutable feature-source objects once and normalize only sources that need runtime fields. Adding or reconfiguring one source no longer rehashes all loaded GeoJSON or replaces unrelated source objects.
- 957ed95: Run the map's first feature hit detection while the page is idle. OpenLayers 10 benchmarks canvas reads on the first hit detection of a rendered vector layer (three 50 ms busy loops in `ExecutorGroup`), which froze the user's first hover or tap on the map for ~150 ms. Maps with feature interactions now trigger it once after a visible vector layer with features has rendered.
- b4d67eb: Refresh compatible runtime and build dependencies, including React Redux, TanStack Query, Vite, Next.js, and Sass 1.106.1 with its empty-attribute-selector fix. Update transitive build tools to patched versions.
- 59c334d: Expose the `webfonts` CSS URL template on lazy Mapbox vector layers so hosts can route fallback fonts through their own proxy.
- Updated dependencies [`b4d67eb`]:
    - `@mapsight/lib-ol@4.3.2 → 4.3.3` (patch)

## 14.6.7

### Patch Changes

- 2f975c0: Keep library builds cached after test-only edits and reuse incremental Core/UI typechecks during local development.
- a27f576: PointInputControls confirm with Enter or Space and wait for a running pan to end, so the point lands under the crosshair. The status updates once the map stops moving and reports confirmation while the stored point is at the centre. The source projection is derived from the editor, and a `crs` is only written for non-geographic sources or to keep an existing one accurate.

    Keyboard measure and share-position drawing also wait for a running pan. Every keyboard crosshair follows view padding and only appears with the map's keyboard focus indicator (`:focus-visible`), not after a pointer click. The measure and share overlays keep their instructions to one sentence and list the keys in a collapsed “Keyboard controls” disclosure (react-aria-components `Disclosure`, styleable via `[data-expanded]`/`[data-focus-visible]`). While a keyboard tool is open, a “Skip to the map” link in its overlay and a “Back to …” link right after the map connect the two without trapping focus; both appear only on keyboard focus (`.ms3-skip-link`). Tool actions use the shared 3 px focus ring. The measure overlay shows a labelled “Distance” output above the keyboard help, live while drawing; “Done” only appears while measuring and stays `aria-disabled` (focusable, announced as unavailable) until there are two points. Native keyboard pan/zoom only read the motion preference for key events, and in-flight reduced-motion handling falls back to execution-time behaviour if OpenLayers' internal animation queue changes.

- Updated dependencies [`2f975c0`]:
    - `@mapsight/lib-js@3.0.10 → 3.0.11` (patch)
    - `@mapsight/lib-ol@4.3.1 → 4.3.2` (patch)
    - `@mapsight/lib-redux@2.2.4 → 2.2.5` (patch)

## 14.6.6

### Patch Changes

- 86c0fe8: Read feature collections without a `crs` in the vector source's configured `projection`, the projection its own writes use, and fall back to EPSG:4326 only when none is configured. Previously the configured projection was ignored when reading, so an editor with a non-geographic `projection` misplaced the features it had just written. A named `crs` still takes precedence.

## 14.6.5

### Patch Changes

- 4e0a815: Add the Mapsight brand header to the package README so it shows on the npm package page.
- 7a399a1: Bump dependencies from Dependabot ([#397](https://github.com/open-mapsight/mapsight/pull/397)):

    - `ol-mapbox-style` `^13.5.1` → `^13.8.0` (minor)
    - `tsc-alias` `^1.9.7` → `^1.9.8` (patch)

- c823f15: Respect reduced motion in core map transitions, feature fits, keyboard pan/zoom, and UI scrolling. Add opt-in PointInputControls with a focused-map keyboard path and explicit confirmation through the editor's point source.

    Preserve point source CRS and collection metadata, retain original fit destinations and exactly-once OL callbacks across motion changes, and finish concurrent/keyboard transitions without cancelling unrelated work. Allow SSR-safe address search inside host forms with `uiState.searchRenderForm: false`.

- Updated dependencies [`7a399a1`]:
    - `@mapsight/lib-ol@4.3.0 → 4.3.1` (patch)

## 14.6.4

### Patch Changes

- 79652e1: Bump dependencies from Dependabot ([#368](https://github.com/open-mapsight/mapsight/pull/368)):

    - `tsc-alias` `^1.9.5` → `^1.9.7` (patch)

- Updated dependencies [`79652e1`, `96cb6b4`]:
    - `@mapsight/lib-ol@4.2.6 → 4.3.0` (minor)

## 14.6.3

### Patch Changes

- 45aaead: Recover feature sources from malformed payloads. The xhr-json loader now rejects non-object bodies and non-array `features` with `XhrJsonPayloadError`, feature indexing skips non-object entries, and a throwing success dispatch now records a load error instead of leaving the source loading forever.
- e74d2c8: Stop `DrawInteraction` from stacking measurement listeners on every map attach and drop its debug logging, and let `TranslateInteraction` actually remove its source listeners when the source changes
- d35cc9f: Handle unavailable map targets and viewports in cursor updates and map context menus with OpenLayers 10.11.
- 86feccf: Bump dependencies from Dependabot ([#315](https://github.com/open-mapsight/mapsight/pull/315)):

    - `ol-mapbox-style` `^13.4.3` → `^13.5.1` (minor)
    - `tsc-alias` `^1.9.4` → `^1.9.5` (patch)
    - `vite` `^8.2.2` → `^8.3.0` (minor)

- 63cf309: Bump dependencies from Dependabot ([#363](https://github.com/open-mapsight/mapsight/pull/363)):

    - `vite` `^8.3.0` → `^8.3.3` (patch)

- c46c174: Add homepage and repository.directory metadata for npm package pages.
- 58a9796: Update the shared Redux Toolkit dependency range from ^2.11.2 to ^2.13.0.
- Updated dependencies [`86feccf`, `5dba09f`, `6e1146e`, `d35cc9f`, `7dd3752`, `c46c174`, `58a9796`]:
    - `@mapsight/lib-js@3.0.9 → 3.0.10` (patch)
    - `@mapsight/lib-ol@4.2.5 → 4.2.6` (patch)
    - `@mapsight/lib-redux@2.2.3 → 2.2.4` (patch)

## 14.6.2

### Patch Changes

- 65e2528: Bump dependencies from Dependabot ([#305](https://github.com/open-mapsight/mapsight/pull/305)):

    - `tsc-alias` `^1.9.3` → `^1.9.4` (patch)

- Updated dependencies [`65e2528`]:
    - `@mapsight/lib-js@3.0.8 → 3.0.9` (patch)
    - `@mapsight/lib-ol@4.2.4 → 4.2.5` (patch)
    - `@mapsight/lib-redux@2.2.2 → 2.2.3` (patch)

## 14.6.1

### Patch Changes

- 2ce2629: Add an opt-in FeatureSourceCache seam so xhr-json loads can reuse a process-memory (or later IDB) document cache keyed by URL and revision
- 0a24a14: Union compiled style `allowedProps` into the OpenLayers feature-update allowlist so host `attr()` keys restyle on poll.
- 35b1990: Skip OpenLayers feature rewrites when a poll rereads the same geometry and core style keys.
- 587c6ff: Skip GeoJSON feature rereads when a poll only changes collection metadata.
- d0e3c5c: Copy SSR-hydrated feature data onto the OpenLayers source on first subscribe so map layers paint without a later navigation.
- 6a3871f: Bump dependencies from Dependabot ([#241](https://github.com/open-mapsight/mapsight/pull/241)):

    - `ol-mapbox-style` `^13.4.2` → `^13.4.3` (patch)
    - `vite` `^8.2.1` → `^8.2.2` (patch)

- 2674b27: Bump dependencies from Dependabot ([#261](https://github.com/open-mapsight/mapsight/pull/261)):

    - `tsc-alias` `^1.9.2` → `^1.9.3` (patch)

- a717fb7: Reveal a place's owning layer on `?feature=` deep links, and add `?src=` only when that catalog source is not already implied
- Updated dependencies [`0a24a14`, `35b1990`, `2674b27`, `0968fcd`]:
    - `@mapsight/lib-ol@4.2.3 → 4.2.4` (patch)

## 14.6.0

### Minor Changes

- bd11b3b: Derive layer visibility from `visibleWhenLayerIds` after each map reduce

### Patch Changes

- 8666339: Bump dependencies from Dependabot updates and security overrides.
- 08f8e3f: Add collapsible layer-switcher groups with visible/total counts and optional base-layer preview thumbnails
- Updated dependencies [`8666339`]:
    - `@mapsight/lib-js@3.0.7 → 3.0.8` (patch)
    - `@mapsight/lib-ol@4.2.2 → 4.2.3` (patch)

## 14.5.1

### Patch Changes

- 2196e08: Fix `@typescript-eslint/unbound-method` lint errors surfaced by typescript-eslint 8.65.

## 14.5.0

### Minor Changes

- 0b2f8a8: Add a lazy-loading MapboxVectorLayer ol-proxy definition for Mapbox/MapLibre style vector tile layers
- 1710d90: Restore additional pre-OSS host runtime compatibility (controller `globalState` reduce arg, layout slot wiring, presentational list toggle, style-env merge) and mark those legacy surfaces `@deprecated` for removal in the next major of each package.

### Patch Changes

- 3539440: Bump dependencies from Dependabot ([#149](https://github.com/open-mapsight/mapsight/pull/149)).
- Updated dependencies [`3539440`, `c58c407`, `1710d90`]:
    - `@mapsight/lib-ol@4.2.1 → 4.2.2` (patch)
    - `@mapsight/lib-js@3.0.5 → 3.0.6` (patch)

## 14.4.2

### Patch Changes

- 01bb11d: Declare MIT license in package manifests.
- Updated dependencies [01bb11d]
    - @mapsight/lib-js@3.0.5
    - @mapsight/lib-ol@4.2.1
    - @mapsight/lib-redux@2.2.2

## 14.4.1

### Patch Changes

- 68d687a: Stop xhr-json feature source autoload loops on HTTP errors with empty status text (for example 404 during partial deploys).

## 14.4.0

### Minor Changes

- b8b31e2: Add a WebGL vector layer proxy definition for configuring OpenLayers WebGL vector layers through Mapsight layer options.

### Patch Changes

- Updated dependencies [8cf6b58]
- Updated dependencies [9fa5b74]
    - @mapsight/lib-ol@4.2.0

## 14.3.0

### Minor Changes

- 6cd6e11: Add bounded feature source history and normalize feature source runtime indexes.

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
- Updated internal dependencies.

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
