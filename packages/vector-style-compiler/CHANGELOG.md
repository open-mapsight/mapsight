# @mapsight/vector-style-compiler

## 13.0.1

### Patch Changes

- e228de9: Brace generated `switch` case bodies so multiple simple styles with `const` bindings do not collide (TDZ / redeclare errors under Vite/Oxc).
- Updated dependencies [`553337a`]:
    - `@mapsight/lib-js@3.0.6 → 3.0.7` (patch)

## 13.0.0

### Patch Changes

- c42d490: Bump dependencies from Dependabot ([#140](https://github.com/open-mapsight/mapsight/pull/140)).
- 3539440: Bump dependencies from Dependabot ([#149](https://github.com/open-mapsight/mapsight/pull/149)).
- Updated dependencies [`3539440`, `0b2f8a8`, `c58c407`, `1710d90`]:
    - `@mapsight/core@14.4.2 → 14.5.0` (minor)
    - `@mapsight/lib-ol@4.2.1 → 4.2.2` (patch)
    - `@mapsight/lib-js@3.0.5 → 3.0.6` (patch)

## 12.1.2

### Patch Changes

- e59928e: Fix selector tokenization when quoted values contain consecutive backslashes.

## 12.1.1

### Patch Changes

- 01bb11d: Declare MIT license in package manifests.
- Updated dependencies [01bb11d]
    - @mapsight/core@14.4.2
    - @mapsight/lib-js@3.0.5
    - @mapsight/lib-ol@4.2.1

## 12.1.0

### Minor Changes

- 2126ff4: Add `prop|` and `env-prop|` prefixes for literal feature and env property keys in selectors and `attr()`, fix string-aware selector tokenization for `|js` expressions, and register selector paths in `allowedProps`.

## 12.0.0

### Minor Changes

- 987e0af: Publish generated IDE metadata for Mapsight vector styles and support nested property declaration blocks in style CSS.

### Patch Changes

- 7d48f25: Bump dependencies from Dependabot ([#96](https://github.com/open-mapsight/mapsight/pull/96)).
- 954e241: Publish the Sass and file-watching dependencies needed by runtime compiler consumers.
- Updated dependencies [b8b31e2]
- Updated dependencies [8cf6b58]
- Updated dependencies [9fa5b74]
    - @mapsight/core@14.4.0
    - @mapsight/lib-ol@4.2.0

## 11.0.0

### Patch Changes

- Updated dependencies [6cd6e11]
    - @mapsight/core@14.3.0

## 10.0.0

### Minor Changes

- 49da00b: Add composable runtime icons: pictogram-based templates and `mapsightIconId` parsing in traffic-style (with configurable default xsmall/small icon zoom levels), async rasterization with volatile style-cache invalidation in lib-ol and vector-style-compiler, plus `useMapsightIcon` and a runtime icon style plugin in ui.

### Patch Changes

- 1e0651c: Replace the deprecated `css` parser dependency with PostCSS to avoid deprecated transitive install warnings.
- 49da00b: Fix nested function codegen and style-tree state assignment in compiled output.
- Updated internal dependencies.

## 9.0.0

### Patch Changes

- Updated dependencies [5eede53]
    - @mapsight/core@14.1.0

## 8.0.3

### Patch Changes

- 744e584: Full release of all packages (now with github releases too?)
- Updated dependencies [744e584]
    - @mapsight/lib-js@3.0.3
    - @mapsight/lib-ol@4.0.3
    - @mapsight/core@14.0.3

## 8.0.2

### Patch Changes

- d4ec483: Full release with CI (try 2)
- Updated dependencies [d4ec483]
    - @mapsight/core@14.0.2
    - @mapsight/lib-js@3.0.2
    - @mapsight/lib-ol@4.0.2

## 8.0.1

### Patch Changes

- fdd3c3a: Full release of all packages via CI
- Updated dependencies [fdd3c3a]
    - @mapsight/core@14.0.1
    - @mapsight/lib-js@3.0.1
    - @mapsight/lib-ol@4.0.1
