# @mapsight/lib-ol

## 4.3.2

### Patch Changes

- 2f975c0: Keep library builds cached after test-only edits and reuse incremental Core/UI typechecks during local development.
- Updated dependencies [`2f975c0`]:
    - `@mapsight/lib-js@3.0.10 → 3.0.11` (patch)

## 4.3.1

### Patch Changes

- 7a399a1: Bump dependencies from Dependabot ([#397](https://github.com/open-mapsight/mapsight/pull/397)):

    - `tsc-alias` `^1.9.7` → `^1.9.8` (patch)

## 4.3.0

### Minor Changes

- 96cb6b4: Add `extrusionRoof`, `extrusionLitWalls` and `extrusionShadedWalls` geometry derivations that draw polygons, including courtyard walls, as pseudo-3D blocks. Heights come from the style group's `extrusion-height`; invalid or non-positive values keep a flat footprint. Derived geometry caching is bounded and supports GeometryCollection children.

### Patch Changes

- 79652e1: Bump dependencies from Dependabot ([#368](https://github.com/open-mapsight/mapsight/pull/368)):

    - `tsc-alias` `^1.9.5` → `^1.9.7` (patch)

## 4.2.6

### Patch Changes

- 86feccf: Bump dependencies from Dependabot ([#315](https://github.com/open-mapsight/mapsight/pull/315)):

    - `tsc-alias` `^1.9.4` → `^1.9.5` (patch)

- 6e1146e: Document the `keepZoom` and `skipIfInView` fit options and export the named constants `DEFAULT_FIT_DURATION`, `DEFAULT_FIT_PADDING`, `DEFAULT_FIT_MAX_ZOOM` (map/fitToExtent) and `DEFAULT_CENTER_DURATION` (view/centerOnFeature) in place of inline magic numbers. No behavior change.
- d35cc9f: Support nullable map targets in OpenLayers 10.11 transition helpers.
- c46c174: Add homepage and repository.directory metadata for npm package pages.
- Updated dependencies [`86feccf`, `5dba09f`, `c46c174`]:
    - `@mapsight/lib-js@3.0.9 → 3.0.10` (patch)

## 4.2.5

### Patch Changes

- 65e2528: Bump dependencies from Dependabot ([#305](https://github.com/open-mapsight/mapsight/pull/305)):

    - `tsc-alias` `^1.9.3` → `^1.9.4` (patch)

- Updated dependencies [`65e2528`]:
    - `@mapsight/lib-js@3.0.8 → 3.0.9` (patch)

## 4.2.4

### Patch Changes

- 0a24a14: Union compiled style `allowedProps` into the OpenLayers feature-update allowlist so host `attr()` keys restyle on poll.
- 35b1990: Skip OpenLayers feature rewrites when a poll rereads the same geometry and core style keys.
- 2674b27: Bump dependencies from Dependabot ([#261](https://github.com/open-mapsight/mapsight/pull/261)):

    - `tsc-alias` `^1.9.2` → `^1.9.3` (patch)

- 0968fcd: Skip OpenLayers `Icon` construction when `icon` is `none` or `src` is empty so area styles can still paint.

## 4.2.3

### Patch Changes

- 8666339: Bump dependencies from Dependabot updates and security overrides.
- Updated dependencies [`8666339`]:
    - `@mapsight/lib-js@3.0.7 → 3.0.8` (patch)

## 4.2.2

### Patch Changes

- 3539440: Bump dependencies from Dependabot ([#149](https://github.com/open-mapsight/mapsight/pull/149)).
- Updated dependencies [`c58c407`, `1710d90`]:
    - `@mapsight/lib-js@3.0.5 → 3.0.6` (patch)

## 4.2.1

### Patch Changes

- 01bb11d: Declare MIT license in package manifests.
- Updated dependencies [01bb11d]
    - @mapsight/lib-js@3.0.5

## 4.2.0

### Minor Changes

- 8cf6b58: Expose `geometryCollectionIndex` and `geometryCollectionTypeIndex` in the vector style env while styling `GeometryCollection` children.

### Patch Changes

- 9fa5b74: Apply fill and stroke opacity declarations to paint color alpha.

## 4.1.0

### Minor Changes

- 49da00b: Add composable runtime icons: pictogram-based templates and `mapsightIconId` parsing in traffic-style (with configurable default xsmall/small icon zoom levels), async rasterization with volatile style-cache invalidation in lib-ol and vector-style-compiler, plus `useMapsightIcon` and a runtime icon style plugin in ui.
- 8d3ccfc: Add `getGeoJsonFeatureSortAnchor` in lib-ol and use it for distance sorting in the feature list. TypeScriptify list components, add tag-switcher and filter toggle controls, extract `MapsightIcon`, and fix a feature-source autoload loop.

    ***

### Patch Changes

- Updated internal dependencies.

## 4.0.3

### Patch Changes

- 744e584: Full release of all packages (now with github releases too?)
- Updated dependencies [744e584]
    - @mapsight/lib-js@3.0.3

## 4.0.2

### Patch Changes

- d4ec483: Full release with CI (try 2)
- Updated dependencies [d4ec483]
    - @mapsight/lib-js@3.0.2

## 4.0.1

### Patch Changes

- fdd3c3a: Full release of all packages via CI
- Updated dependencies [fdd3c3a]
    - @mapsight/lib-js@3.0.1
