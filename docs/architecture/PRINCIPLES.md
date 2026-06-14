# Architecture principles

North-star goals for Mapsight as a **communicative, embed-first** GIS frontend. For deployment topology see [Ecosystem](ECOSYSTEM.md); for implementation status see [Current vs target](CURRENT_VS_TARGET.md).

---

## Product scope

### In scope

- **Communicative maps** — thematic, narrative, and task-oriented map experiences for residents, visitors, and campaign audiences.
- **Embed-first delivery** — CMS snippets, SPAs, and host-branded pages where the map feels native to the site, not a generic portal chrome.
- **Declarative GIS runtime** — Redux-backed state that drives OpenLayers; see [Redux architecture](../../packages/core/docs/REDUX_ARCHITECTURE.md).
- **Consuming published geodata** — GeoJSON, WMS/WFS, ArcGIS REST, and HTTP APIs from host infrastructure.
- **Composable host-native UI** — build the experience you need: map and/or list, one or many of each, tag filters, layer selectors (in the map, in the list, or elsewhere), plus theming so municipal, city marketing, and third-sector sites match their design system.

### Adjacent, not core

- **Geoportals / Fachportale** — Masterportal, CIVITAS geoportal slots, vendor catalog UIs. A city may run both; Mapsight does not try to replicate pro-user layer catalogs, auth, or OGC self-service.
- **Regional embed programs** — anchor hosts offering map hosting to smaller orgs (vision; not a shipped product today).

### Out of scope

- **GIS back-office** — GeoServer admin, QGIS Desktop, FME, PostGIS pipelines. Mapsight consumes outputs; it does not replace them.
- **Hosted map SaaS** — Mapsight is npm packages and embed patterns for **host-owned** sites, not a proprietary map platform or Google Maps–style API product.
- **Shipping basemaps** — hosts choose tile or WMS sources; see [Ecosystem → basemaps](ECOSYSTEM.md#basemap-and-tile-sources).

---

## UX goals

1. **Clarity over GIS jargon** — labels, filters, and legends for public audiences.
2. **Performance on real CMS pages** — lazy embeds, bounded bundle size, no unnecessary portal chrome.
3. **Accessibility and i18n** — English-first development; multi-locale deployments via host config (see [Decision 008](decisions/008-i18n-approach.md)).
4. **Trust and privacy** — prefer self-hosted or proxied basemaps and data paths that do not send visitor traffic to unrelated third-party map APIs by default. Mapsight does not treat Google Maps or Mapbox-as-platform as the default stack for trust-sensitive public hosts; see [GIS stack choices](../ecosystem/GIS_STACK_CHOICES.md).

---

## Technical principles

| Principle                                    | Rationale                                                                                                                                |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Single source of truth in Redux**          | Map, list, filters, and UI stay in sync; OpenLayers is a projection of state.                                                            |
| **Actions over ad-hoc OL calls**             | Use the [action guide](../../packages/core/docs/ACTION_GUIDE.md) so behavior is testable and replayable.                                 |
| **Packages over monolith**                   | `@mapsight/core`, `@mapsight/ui`, styles, and domain packages compose in host apps.                                                      |
| **TypeScript everywhere; Zod at boundaries** | Application and library code in TypeScript; **Zod runtime validation** at config and API boundaries for safe parsing and inferred types. |
| **Open standards at the data layer**         | GeoJSON, OGC WMS/WFS, common REST patterns — avoid lock-in to one vendor stack.                                                          |
| **Host owns deployment**                     | Reverse proxy, CMS, basemap policy, and data pipelines are host responsibilities; Mapsight documents patterns.                           |

---

## Composable UI vs fixed portal shell

Geoportals ship a **fixed portal shell** — one layout, one layer catalog, one chrome. Mapsight optimizes for **host-native, composable** experiences:

- **Layout freedom** — map only, list only, or any combination; multiple maps or lists on one page when the story needs it.
- **Controls where they belong** — tag filters, layer selectors, and legends in the map, in the list, or in surrounding page chrome.
- **Declarative configuration** — CMS or app bootstrap passes JSON that drives the full UI; multi-page sites can transition between Mapsight states without full reloads.
- **Theming** — embed presets and SCSS/BEM styling today (see package READMEs); native CSS migration under evaluation ([Decision 009](decisions/009-native-css-over-scss.md)); headless or token-based theming ([Decision 007](decisions/007-ui-styling-strategy.md)).

The goal: a city marketing campaign page and a municipal department page should both feel like _their_ site — with the map product shape that fits the content — not a shared GIS portal skin.

---

## Non-goals (explicit)

- Replacing Masterportal or building a full geoportal clone.
- Operating hosted multi-tenant Mapsight SaaS (unless we explicitly revisit that scope later).
- Mandating one CMS or one PHP stack — patterns should generalize across Infosite, TYPO3, headless CMS, and pure React hosts.

---

## Related

- [Ecosystem](ECOSYSTEM.md)
- [Current vs target](CURRENT_VS_TARGET.md)
- [Decisions](decisions/README.md)
- [Licensing](../LICENSING.md)
