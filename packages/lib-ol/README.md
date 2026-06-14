# @mapsight/lib-ol

Shared **OpenLayers helpers** used across Mapsight packages — style function types, multi-level style caching, map fit/animation utilities, feature hit-testing, clustering, and geometry derivation. Import subpaths directly (there is no single barrel export).

See the [documentation hub](https://github.com/open-mapsight/mapsight/blob/main/docs/README.md) for architecture and integration context.

## Common imports

| Module                                                              | Purpose                                                |
| ------------------------------------------------------------------- | ------------------------------------------------------ |
| `@mapsight/lib-ol/style/createCachedStyleFunction`                  | 3-level LRU cache wrapper for compiled style functions |
| `@mapsight/lib-ol/style/styleFunction`                              | `MapsightStyleFunction` and env types                  |
| `@mapsight/lib-ol/style/styleFeatureScope`                          | Hooks for runtime icon and style scope                 |
| `@mapsight/lib-ol/map/fitToFeature`, `fitToExtent`, `fitToFeatures` | View fitting with padding                              |
| `@mapsight/lib-ol/feature/detectFeatureHits`                        | Pointer hit detection                                  |
| `@mapsight/lib-ol/feature/getGeoJsonFeatureSortAnchor`              | Distance sorting anchor for lists                      |

Peer dependency: `ol`.

## Related packages

| Package                                                                                                                           | Role                                                            |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [`@mapsight/vector-style-compiler`](https://github.com/open-mapsight/mapsight/blob/main/packages/vector-style-compiler/README.md) | Emits imports of `createCachedStyleFunction` in compiled output |
| [`@mapsight/traffic-style`](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/README.md)                 | Default compiled style built on this cache                      |
| [`@mapsight/core`](https://github.com/open-mapsight/mapsight/blob/main/packages/core/README.md)                                   | Map controller uses style and fit helpers                       |
| [`@mapsight/ui`](https://github.com/open-mapsight/mapsight/blob/main/packages/ui/README.md)                                       | UI plugins and config types                                     |
