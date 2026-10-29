# @mapsight/vector-style-compiler

## 13.1.3

### Patch Changes

- b4d67eb: Refresh compatible runtime and build dependencies, including React Redux, TanStack Query, Vite, Next.js, and Sass 1.106.1 with its empty-attribute-selector fix. Update transitive build tools to patched versions.
- Updated dependencies [`ab13ef7`, `2270229`, `eed3ab3`, `374a3e4`, `2d13e3d`, `957ed95`, `b4d67eb`, `59c334d`]:
    - `@mapsight/core@14.6.7 → 14.6.8` (patch)
    - `@mapsight/lib-ol@4.3.2 → 4.3.3` (patch)

## 13.1.2

### Patch Changes

- c1627bd: Keep popovers connected to their visible title when opened after an initially closed render.
  Include nested fill and stroke constructors for compiled text and regular-shape styles.
  Replace compiler source snapshots and mocked popover checks with executable behavior tests.
- 2f975c0: Keep library builds cached after test-only edits and reuse incremental Core/UI typechecks during local development.
- Updated dependencies [`2f975c0`, `a27f576`]:
    - `@mapsight/core@14.6.6 → 14.6.7` (patch)
    - `@mapsight/lib-js@3.0.10 → 3.0.11` (patch)
    - `@mapsight/lib-ol@4.3.1 → 4.3.2` (patch)

## 13.1.1

### Patch Changes

- 133cf96: Bump dependencies from Dependabot ([#396](https://github.com/open-mapsight/mapsight/pull/396)):

    - `postcss` `^8.5.30` → `^8.5.31` (patch)
    - `sass` `^1.105.0` → `1.105.1` (patch)

- f96b0e4: Bump dependencies from Dependabot ([#398](https://github.com/open-mapsight/mapsight/pull/398)):

    - `chokidar` `^5.0.0` → `^6.0.0` (major)

- Updated dependencies [`4e0a815`, `7a399a1`, `c823f15`]:
    - `@mapsight/core@14.6.4 → 14.6.5` (patch)
    - `@mapsight/lib-ol@4.3.0 → 4.3.1` (patch)

## 13.1.0

### Minor Changes

- 96cb6b4: Document derived geometries (`geometry`) including pseudo-3D extrusion with `extrusion-height`, and list both properties in the IDE metadata

### Patch Changes

- dd49f24: Bump dependencies from Dependabot ([#367](https://github.com/open-mapsight/mapsight/pull/367)):

    - `postcss` `^8.5.29` → `^8.5.30` (patch)

- Updated dependencies [`79652e1`, `96cb6b4`]:
    - `@mapsight/core@14.6.3 → 14.6.4` (patch)
    - `@mapsight/lib-ol@4.2.6 → 4.3.0` (minor)

## 13.0.5

### Patch Changes

- 86feccf: Bump dependencies from Dependabot ([#315](https://github.com/open-mapsight/mapsight/pull/315)):

    - `vite` `^8.2.2` → `^8.3.0` (minor)

- 5980a66: Bump dependencies from Dependabot ([#316](https://github.com/open-mapsight/mapsight/pull/316)):

    - `fs-extra` `^11.4.0` → `^11.4.1` (patch)
    - `sass` `^1.104.0` → `^1.105.0` (minor)

- 63cf309: Bump dependencies from Dependabot ([#363](https://github.com/open-mapsight/mapsight/pull/363)):

    - `vite` `^8.3.0` → `^8.3.3` (patch)

- d35cc9f: Bump dependencies from Dependabot ([#364](https://github.com/open-mapsight/mapsight/pull/364)):

    - `postcss` `^8.5.28` → `^8.5.29` (patch)

- c46c174: Add homepage and repository.directory metadata for npm package pages.
- Updated dependencies [`45aaead`, `e74d2c8`, `d35cc9f`, `86feccf`, `63cf309`, `5dba09f`, `6e1146e`, `c46c174`, `58a9796`]:
    - `@mapsight/core@14.6.2 → 14.6.3` (patch)
    - `@mapsight/lib-js@3.0.9 → 3.0.10` (patch)
    - `@mapsight/lib-ol@4.2.5 → 4.2.6` (patch)

## 13.0.4

### Patch Changes

- 093b3f0: Bump production dependencies from Dependabot ([#304](https://github.com/open-mapsight/mapsight/pull/304)):

    - `react-aria` `^3.52.0` → `^3.52.1` (patch)
    - `react-aria-components` `^1.21.0` → `^1.21.1` (patch)
    - `postcss` `^8.5.26` → `^8.5.28` (patch)
    - `sass` `^1.103.1` → `^1.104.0` (minor)
    - `@types/react-dom` `^19.2.5` → `~19.2.7` (patch)
    - `@playwright/test` `^1.62.1` → `^1.63.0` (minor)
    - `playwright` `^1.62.1` → `^1.63.0` (minor)

- Updated dependencies [`65e2528`]:
    - `@mapsight/core@14.6.1 → 14.6.2` (patch)
    - `@mapsight/lib-js@3.0.8 → 3.0.9` (patch)
    - `@mapsight/lib-ol@4.2.4 → 4.2.5` (patch)

## 13.0.3

### Patch Changes

- 99f002d: Bump dependencies from Dependabot ([#240](https://github.com/open-mapsight/mapsight/pull/240)):

    - `sass` `^1.102.0` → `^1.103.1` (minor)

- 6a3871f: Bump dependencies from Dependabot ([#241](https://github.com/open-mapsight/mapsight/pull/241)):

    - `vite` `^8.2.1` → `^8.2.2` (patch)

- Updated dependencies [`2ce2629`, `0a24a14`, `35b1990`, `587c6ff`, `d0e3c5c`, `6a3871f`, `2674b27`, `0968fcd`, `a717fb7`]:
    - `@mapsight/core@14.6.0 → 14.6.1` (patch)
    - `@mapsight/lib-ol@4.2.3 → 4.2.4` (patch)

## 13.0.2

### Patch Changes

- 8666339: Bump dependencies from Dependabot updates and security overrides.
- Updated dependencies [`bd11b3b`, `8666339`, `08f8e3f`]:
    - `@mapsight/core@14.5.1 → 14.6.0` (minor)
    - `@mapsight/lib-js@3.0.7 → 3.0.8` (patch)
    - `@mapsight/lib-ol@4.2.2 → 4.2.3` (patch)

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
