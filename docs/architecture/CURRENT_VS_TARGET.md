# Current vs target

What exists in the monorepo today versus planned direction.

> **For evaluators:** Mapsight is used in **controlled production deployments**, but the open-source tree is **WIP** —
> embed patterns, pulp, and tile-proxy are documented; OSI license, Infosite Java modules, SSR standardization, and i18n
> remain open. See [Licensing](../LICENSING.md).

Legend: **Done** · **Partial** · **Planned** · **Out of scope**

---

## Product and scope

| Area                        | Current                                                               | Target                                                                                                                               | Decision                                                                                  |
| --------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Communicative embed maps    | **Done** — core + ui; CMS embed pattern documented                    | More public examples; Infosite guide when modules reviewed                                                                           | [001](decisions/001-react-over-vue.md), [010](decisions/010-audience-scope.md)            |
| Geoportal product           | **Out of scope** — optional adjacent Masterportal/CIVITAS             | Document coexistence only                                                                                                            | —                                                                                         |
| Regional embed host program | **Not productized** — third-party tenant embeds from anchor operators | Vision only — see [GIS stack choices § future feature](../ecosystem/GIS_STACK_CHOICES.md#future-feature-regional-embed-host-program) | —                                                                                         |
| Composable host-native UI   | **Partial** — map/list/filter composition, SCSS/BEM presets           | Token strategy TBD; native CSS migration TBD                                                                                         | [007](decisions/007-ui-styling-strategy.md), [009](decisions/009-native-css-over-scss.md) |
| Basemap delivery            | **Done** — documented patterns A–D in [Ecosystem](ECOSYSTEM.md)       | Keep integration guides current                                                                                                      | —                                                                                         |

---

## Runtime and state

| Area                    | Current                                                                             | Target                                                        | Decision                                                    |
| ----------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| Redux ↔ OpenLayers sync | **Done** — see [Redux architecture](../../packages/core/docs/REDUX_ARCHITECTURE.md) | Keep reference current                                        | [004](decisions/004-redux-in-core-react-state-in-ui.md)     |
| Action taxonomy         | **Done** — [Action guide](../../packages/core/docs/ACTION_GUIDE.md)                 | RTK slices, fewer legacy paths                                | [004](decisions/004-redux-in-core-react-state-in-ui.md)     |
| GeoJSON feature model   | **Done**                                                                            | Same                                                          | [003](decisions/003-geojson-first-data-model.md)            |
| Map engine              | **Done** — OpenLayers                                                               | Same                                                          | [002](decisions/002-openlayers-over-maplibre.md)            |
| Config validation (Zod) | **Partial**                                                                         | TypeScript everywhere; Zod at config/API boundaries           | [004](decisions/004-redux-in-core-react-state-in-ui.md)     |
| HTTP / async loading    | **Partial** — hand-rolled loaders in core + ui; TanStack Query in domain apps       | fetch + Query layers; **RTK Query for core TBD**              | [005](decisions/005-fetch-and-tanstack-query-over-axios.md) |
| SSR / hydration         | **Partial** — sidecar SSR proven; monorepo hooks exist                              | Modern framework SSR + graceful fallback; **Node vs Bun TBD** | [006](decisions/006-ssr-state-hydration-goal.md)            |
| i18n                    | **Partial** — `lang` in embed config                                                | OSS i18n library; English-first dev, multi-locale hosts       | [008](decisions/008-i18n-approach.md)                       |

---

## Packages and apps

| Package / app                           | Current                             | Target                                                              |
| --------------------------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| `@mapsight/core`                        | **Done** — published                | Stable semver, richer docs                                          |
| `@mapsight/ui`                          | **Done** — published                | Feature list sorter UX (deferred)                                   |
| `@mapsight/traffic-style`               | **Done**                            | Custom icon build docs                                              |
| `@mapsight/vector-style-compiler`       | **Done** — deep dive exists         | —                                                                   |
| `@mapsight/vite-host-embed`             | **Done** — published via Changesets | Host embed Vite plugin (lib finalize, snippet markers, dev aliases) |
| `@mapsight/vite-count-aggregator-embed` | **Done** — workspace package        | Count-aggregator app-shell CMS embed finalize                       |
| `@mapsight/count-aggregator-ui`         | **Partial**                         | Public API package alignment                                        |
| `apps/showcase`                         | **Done**                            | UI and integration demos                                            |
| `starters/mapsight-host-starter`        | **Beta**                            | Copy-out host embed reference                                       |
| `starters/mapsight-next-starter`        | **WIP**                             | Copy-out Next.js template                                           |
| `starters/mapsight-vite-spa-starter`    | **WIP**                             | Copy-out Vite SPA template                                          |
| `apps/docs` (VitePress)                 | **Planned**                         | Browse `docs/` on site                                              |
| Open-source license file                | **Planned**                         | See [Licensing](../LICENSING.md)                                    |

---

## Ecosystem and integration

| Area                         | Current                                                                                                                                             | Target                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| mapsight-pulp (public)       | **Done** — [open-mapsight/mapsight-pulp](https://github.com/open-mapsight/mapsight-pulp); [integration guide](../integration/PULP.md)               | —                                     |
| tile-proxy (public)          | **Done** — part of [open-mapsight/mapsight-pulp](https://github.com/open-mapsight/mapsight-pulp); [integration guide](../integration/TILE_PROXY.md) | —                                     |
| CMS integration guides       | **Partial** — [CMS_PHP](../integration/CMS_PHP.md) done; Infosite pending review                                                                    | Complete Infosite guide               |
| Data platform docs           | **Partial** — [DATA_BACKEND](../integration/DATA_BACKEND.md); platform host-operated                                                                | Expand when platform is open-sourced  |
| GIS stack / positioning docs | **Done** — [GIS_STACK_CHOICES](../ecosystem/GIS_STACK_CHOICES.md), [POSITIONING](../ecosystem/POSITIONING.md)                                       | —                                     |
| Decision notes               | **Started** — [decisions/README.md](decisions/README.md)                                                                                            | Keep updating as architecture changes |

---

## Documentation

| Area                    | Current                                                                                             | Target            |
| ----------------------- | --------------------------------------------------------------------------------------------------- | ----------------- |
| Docs hub                | **Done** — [docs/README.md](../README.md)                                                           | —                 |
| Architecture principles | **Done**                                                                                            | —                 |
| Decision records        | **Done**                                                                                            | —                 |
| Contributor standards   | **Done** — [STANDARDS](../development/STANDARDS.md), [CONTRIBUTING](../development/CONTRIBUTING.md) | —                 |
| Project history         | **Partial** — [HISTORY](../project/HISTORY.md)                                                      | Verified timeline |
