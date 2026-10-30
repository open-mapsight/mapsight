# @mapsight/vite-host-embed

## 1.1.7

### Patch Changes

- 374a3e4: Use the native TypeScript 7 compiler for typechecks and library builds while preserving the TypeScript 6 API for existing tools and the UI's public React prop declarations.
- b4d67eb: Refresh compatible runtime and build dependencies, including React Redux, TanStack Query, Vite, Next.js, and Sass 1.106.1 with its empty-attribute-selector fix. Update transitive build tools to patched versions.

## 1.1.6

### Patch Changes

- 86feccf: Bump dependencies from Dependabot ([#315](https://github.com/open-mapsight/mapsight/pull/315)):

    - `vite` `^8.2.2` → `^8.3.0` (minor)

- 63cf309: Bump dependencies from Dependabot ([#363](https://github.com/open-mapsight/mapsight/pull/363)):

    - `vite` `^8.3.0` → `^8.3.3` (patch)

- c46c174: Add homepage and repository.directory metadata for npm package pages.

## 1.1.5

### Patch Changes

- 6a3871f: Bump dependencies from Dependabot ([#241](https://github.com/open-mapsight/mapsight/pull/241)):

    - `vite` `^8.2.1` → `^8.2.2` (patch)

## 1.1.4

### Patch Changes

- 8666339: Bump dependencies from Dependabot updates and security overrides.

## 1.1.3

### Patch Changes

- 3539440: Bump dependencies from Dependabot ([#149](https://github.com/open-mapsight/mapsight/pull/149)).

## 1.1.2

### Patch Changes

- 01bb11d: Declare MIT license in package manifests.

## 1.1.1

### Patch Changes

- ee02e23: Keep hashed JS/CSS entry assets and write the stable files as small wrappers.

## 1.1.0

### Minor Changes

- 1e0651c: Add `@mapsight/vite-host-embed`, a Vite plugin for Mapsight host embed production builds: static asset copying, CSS url rewriting, HTML snippet extraction, and optional Apache `.htaccess` generation.

    ***
