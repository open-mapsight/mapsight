# @mapsight/core

**Mapsight Core** — the Redux GIS runtime for web mapping with OpenLayers. The entire map (layers, view, controls, interactions, feature data) lives as serializable JSON in one store; **controllers** sync that state to OpenLayers and back. React is optional — [`@mapsight/ui`](https://github.com/open-mapsight/mapsight/blob/main/packages/ui/README.md) is the default view layer on top.

See the [documentation hub](https://github.com/open-mapsight/mapsight/blob/main/docs/README.md) for architecture, integration patterns, and licensing.

## Quick start

Most apps use `@mapsight/ui` `create()`, which wires core internally. To use core directly, instantiate the store and controllers from the package exports (see Redux docs below).

For a full working example with default styles, start with [`apps/showcase`](https://github.com/open-mapsight/mapsight/tree/main/apps/showcase) or the [`@mapsight/traffic-style`](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/README.md) quick start.

## Documentation

| Guide                                                                                                                          | Description                                                |
| ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| [Documentation hub](https://github.com/open-mapsight/mapsight/blob/main/docs/README.md)                                        | Architecture, ecosystem, integration overview              |
| [Mapsight Redux Architecture](https://github.com/open-mapsight/mapsight/blob/main/packages/core/docs/REDUX_ARCHITECTURE.md)    | How the Redux store, controllers, and OpenLayers sync work |
| [Mapsight Action API — Decision Guide](https://github.com/open-mapsight/mapsight/blob/main/packages/core/docs/ACTION_GUIDE.md) | Which action API to dispatch for a given task              |
| [SSR and hydration](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/SSR_HYDRATION.md)                     | Serializable state for CMS embeds                          |
| [Data backend](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/DATA_BACKEND.md)                           | GeoJSON and layer data patterns                            |

## Related packages

| Package                                                                                                                           | Role                                                    |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| [`@mapsight/ui`](https://github.com/open-mapsight/mapsight/blob/main/packages/ui/README.md)                                       | Default React UI and embed helpers                      |
| [`@mapsight/lib-ol`](https://github.com/open-mapsight/mapsight/blob/main/packages/lib-ol/README.md)                               | Style function types, cached OL styling, map helpers    |
| [`@mapsight/lib-redux`](https://github.com/open-mapsight/mapsight/blob/main/packages/lib-redux/README.md)                         | Path reducers, state observation, store enhancers       |
| [`@mapsight/vector-style-compiler`](https://github.com/open-mapsight/mapsight/blob/main/packages/vector-style-compiler/README.md) | Compile CSS styles to a core-compatible `styleFunction` |

## Releases

Version bumps and npm publish are managed from the monorepo root with [Changesets](https://github.com/changesets/changesets). Do not run `npm version` or `npm publish` from this package directory. See [Contributing — Releases](https://github.com/open-mapsight/mapsight/blob/main/docs/development/CONTRIBUTING.md#releases).
