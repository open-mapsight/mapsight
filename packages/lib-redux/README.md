# @mapsight/lib-redux

Shared **Redux utilities** for Mapsight — immutable path reducers, controlled dispatch, async action middleware, state observation, and local-storage helpers. Used by [`@mapsight/core`](https://github.com/open-mapsight/mapsight/blob/main/packages/core/README.md) and [`@mapsight/ui`](https://github.com/open-mapsight/mapsight/blob/main/packages/ui/README.md) plugins; not intended as a general-purpose Redux toolkit for host apps.

See the [documentation hub](https://github.com/open-mapsight/mapsight/blob/main/docs/README.md) for architecture context. For GIS state patterns, start with [Mapsight Redux Architecture](https://github.com/open-mapsight/mapsight/blob/main/packages/core/docs/REDUX_ARCHITECTURE.md) (`@mapsight/core`).

## Common imports

| Module                                                       | Purpose                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `@mapsight/lib-redux/reducers/immutable-path`                | Path-based `set`, `merge`, `add-to`, `remove-from` reducers              |
| `@mapsight/lib-redux/reducers/immutable`                     | Immutable collection reducers                                            |
| `@mapsight/lib-redux/observe-state`                          | Subscribe to derived store slices (`observeState`, `getAndObserveState`) |
| `@mapsight/lib-redux/local-storage`                          | Persist slice to `localStorage`                                          |
| `@mapsight/lib-redux/matchesPath`, `matchPath`               | Action path matching                                                     |
| `@mapsight/lib-redux/enable-controlled-dispatch-and-observe` | Controlled vs uncontrolled store loop prevention                         |

## Related packages

| Package                                                                                         | Role                                                       |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [`@mapsight/core`](https://github.com/open-mapsight/mapsight/blob/main/packages/core/README.md) | Primary consumer — GIS store and controllers               |
| [`@mapsight/ui`](https://github.com/open-mapsight/mapsight/blob/main/packages/ui/README.md)     | Browser plugins (share link, geolocation, analytics, etc.) |
