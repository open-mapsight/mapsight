# Mapsight documentation

Mapsight is **actively evolving (WIP)**: used in controlled production deployments, not yet a turnkey product for
self-service integrators. See [Current vs target](architecture/CURRENT_VS_TARGET.md) and [Licensing](LICENSING.md).

---

## Start here — by role

| I am…                                     | Start with                                                                                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Evaluating** product fit or procurement | [GIS stack choices](ecosystem/GIS_STACK_CHOICES.md) → [Positioning](ecosystem/POSITIONING.md) → [Licensing](LICENSING.md)                           |
| **Integrating** a CMS snippet embed       | [Integration overview](integration/OVERVIEW.md) → [CMS embed pattern](integration/CMS_PHP.md) → [Config reference](integration/CONFIG_REFERENCE.md) |
| **Integrating** a React SPA or Next app   | [Getting started](getting-started.md) → [REACT_SPA](integration/REACT_SPA.md) or [NEXTJS](integration/NEXTJS.md)                                    |
| **Publishing** GeoJSON or OGC layers      | [Publishing data](integration/PUBLISHING_DATA.md) → [OGC layers](integration/OGC_LAYERS.md)                                                         |
| **Pasting** snippets in a CMS (editor)    | [For CMS editors](integration/CMS_EDITORS.md)                                                                                                       |
| **Contributing** to the monorepo          | [Contributing](development/CONTRIBUTING.md) → [Standards](development/STANDARDS.md)                                                                 |

### Product and deployment maps

- **Diagram A — Product channels** (_who needs what kind of map?_): [GIS stack choices](ecosystem/GIS_STACK_CHOICES.md)
- **Diagram B — Technical deployment** (_what runs where?_): [Ecosystem](architecture/ECOSYSTEM.md)

Terms like _communicative map_, _Fachportal_, _pulp_: see [Glossary](ecosystem/GIS_STACK_CHOICES.md#glossary).

### Stable integration paths

Maintainer deployments currently exercise:

- CMS snippet embed — [`CMS_PHP`](integration/CMS_PHP.md), reference starter [
  `starters/mapsight-host-starter`](../starters/mapsight-host-starter), plugin [
  `@mapsight/vite-host-embed`](../packages/vite-host-embed/README.md)
- Count-aggregator CMS app shell — [
  `count-aggregator-ui`](../packages/count-aggregator-ui/README.md#cms-app-shell-embed), plugin [
  `@mapsight/vite-count-aggregator-embed`](../packages/vite-count-aggregator-embed/README.md)
- mapsight-pulp static GeoJSON — [`PULP`](integration/PULP.md)
- Basemap tile proxy pattern — [`TILE_PROXY`](integration/TILE_PROXY.md)
- Declarative embed config + Redux runtime — [Redux architecture](../packages/core/docs/REDUX_ARCHITECTURE.md)

**Still evolving:** OSI license, full Infosite Java guide, SSR sidecar standardization, i18n library choice —
see [Current vs target](architecture/CURRENT_VS_TARGET.md).

---

## Architecture

| Document                                                  | About                                       |
| --------------------------------------------------------- | ------------------------------------------- |
| [ECOSYSTEM.md](architecture/ECOSYSTEM.md)                 | Technical deployment stack, repos, basemaps |
| [PRINCIPLES.md](architecture/PRINCIPLES.md)               | Product goals and non-goals                 |
| [CURRENT_VS_TARGET.md](architecture/CURRENT_VS_TARGET.md) | Implementation status matrix                |
| [Decisions](architecture/decisions/README.md)             | Architecture decision notes                 |
| [Project history](project/HISTORY.md)                     | Origin timeline (unverified)                |

## Ecosystem

| Document                                               | About                                                     |
| ------------------------------------------------------ | --------------------------------------------------------- |
| [GIS_STACK_CHOICES.md](ecosystem/GIS_STACK_CHOICES.md) | Product channels, stakeholder matrix, stack comparison    |
| [POSITIONING.md](ecosystem/POSITIONING.md)             | Masterportal comparison; CIVITAS geoportal context        |
| [COEXISTENCE.md](ecosystem/COEXISTENCE.md)             | Mapsight embeds alongside Masterportal / shared GeoServer |

## Integration

| Document                                                   | About                                          |
| ---------------------------------------------------------- | ---------------------------------------------- |
| [OVERVIEW.md](integration/OVERVIEW.md)                     | Three-layer model, embed lifecycle             |
| [getting-started.md](getting-started.md)                   | npm library path — install to first map        |
| [CONFIG_REFERENCE.md](integration/CONFIG_REFERENCE.md)     | Embed JSON anatomy + Zod entry points          |
| [CMS_PHP.md](integration/CMS_PHP.md)                       | Generic CMS snippet embed                      |
| [CMS_EDITORS.md](integration/CMS_EDITORS.md)               | Safe vs forbidden snippet edits                |
| [CMS_INFOSITE.md](integration/CMS_INFOSITE.md)             | Infosite CMS (**stub**, pending module review) |
| [PUBLISHING_DATA.md](integration/PUBLISHING_DATA.md)       | GeoJSON handoff for data stewards              |
| [OGC_LAYERS.md](integration/OGC_LAYERS.md)                 | WMS/WFS overlay patterns                       |
| [PRIVACY_DATA_FLOWS.md](integration/PRIVACY_DATA_FLOWS.md) | Visitor data flows for hosts / DPOs            |
| [PULP.md](integration/PULP.md)                             | mapsight-pulp ETL                              |
| [TILE_PROXY.md](integration/TILE_PROXY.md)                 | Basemap tile proxy                             |
| [DATA_BACKEND.md](integration/DATA_BACKEND.md)             | Optional host data platform                    |
| [SSR_HYDRATION.md](integration/SSR_HYDRATION.md)           | Dehydrated state contract                      |
| [REACT_SPA.md](integration/REACT_SPA.md)                   | Vite SPA starter + showcase feature demo       |
| [NEXTJS.md](integration/NEXTJS.md)                         | Next.js starter pattern                        |

**TYPO3:** **Pending** dedicated guide — same mental model as [CMS_PHP.md](integration/CMS_PHP.md).

## Compliance

| Document                             | About                            |
| ------------------------------------ | -------------------------------- |
| [LICENSING.md](LICENSING.md)         | License status + FAQ             |
| [ACCESSIBILITY.md](ACCESSIBILITY.md) | Accessibility status (pre-audit) |

## Development

| Document                             | About                                                       |
| ------------------------------------ | ----------------------------------------------------------- |
| [Development](development/README.md) | Contributor workflow, standards, releases, maintainer tasks |

## Implementation deep dives

| Topic                                                   | Location                                                                                                                          |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Mapsight Redux Architecture (`@mapsight/core`)          | [packages/core/docs/REDUX_ARCHITECTURE.md](../packages/core/docs/REDUX_ARCHITECTURE.md)                                           |
| Mapsight Action API — Decision Guide (`@mapsight/core`) | [packages/core/docs/ACTION_GUIDE.md](../packages/core/docs/ACTION_GUIDE.md)                                                       |
| Vector style compiler — architecture deep dive          | [packages/vector-style-compiler/docs/ARCHITECTURE_DEEP_DIVE.md](../packages/vector-style-compiler/docs/ARCHITECTURE_DEEP_DIVE.md) |
| Traffic / icon styles                                   | [packages/traffic-style/docs/](../packages/traffic-style/docs/)                                                                   |

## Demo applications

| App           | Path                                          | Use for                    |
| ------------- | --------------------------------------------- | -------------------------- |
| Showcase      | [`apps/showcase`](../apps/showcase)           | React Router SPA, UI demos |
| Vector editor | [`apps/vector-editor`](../apps/vector-editor) | GeoJSON editing            |

## Copy-out starters

| Starter                   | Path                                                                          | Use for                                    |
| ------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------ |
| Host embed starter (beta) | [`starters/mapsight-host-starter`](../starters/mapsight-host-starter)         | Vite lib embed build + paste-ready snippet |
| Next.js starter (WIP)     | [`starters/mapsight-next-starter`](../starters/mapsight-next-starter)         | Next.js App Router copy-out template       |
| Vite SPA starter (WIP)    | [`starters/mapsight-vite-spa-starter`](../starters/mapsight-vite-spa-starter) | Minimal React Router SPA copy-out template |

## Package index

See the [root README](../README.md#package-overview) for npm packages and one-line descriptions.

## Contributing

See [development/CONTRIBUTING.md](development/CONTRIBUTING.md)
and [architecture/decisions/README.md](architecture/decisions/README.md).
