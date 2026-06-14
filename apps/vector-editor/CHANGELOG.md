# @mapsight/vector-editor

## 1.2.1

### Patch Changes

- c0a1f4d: Fix dependency security alerts by resolving `shell-quote` to the patched release and upgrading the vector editor tooltip dependency to remove the vulnerable `uuid` transitive dependency.
- Updated dependencies [c0a1f4d]
    - @mapsight/lib-redux@2.2.1

## 1.2.0

### Minor Changes

- 49da00b: Migrate to Redux Toolkit 2, Redux 5, react-redux 9, and reselect 5; replace `createStructuredSelector` usage, prefer `@reduxjs/toolkit` exports, and update the vector-editor browser renderer to React 18 `createRoot`.

### Patch Changes

- Updated internal dependencies.

## 1.1.0

### Minor Changes

- 5eede53: Prepare to move to redux toolkit, cleanup types, cleanup code

### Patch Changes

- Updated dependencies [5eede53]
    - @mapsight/lib-redux@2.1.0
    - @mapsight/core@14.1.0

## 1.0.2

### Patch Changes

- 29f3dca: Update dep date-fns to ^4.1.0
