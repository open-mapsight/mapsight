# Ecosystem positioning

Comparison of Mapsight with adjacent **open-source GIS products** in typical German municipal and regional contexts.

For **who** needs **what kind of map**, see [GIS stack choices](GIS_STACK_CHOICES.md). For **deployment topology**,
see [Ecosystem](../architecture/ECOSYSTEM.md).

---

## Shared context

German public-sector and regional GIS often combines:

- **OpenLayers** for web mapping (Mapsight, Masterportal, and many custom stacks)
- **GeoServer** or equivalent for OGC layer publishing
- **CMS-hosted** communicative pages alongside optional **geoportals** for planners
- Growing interest in **Public Money – Public Code** and platforms such as [opencode.de](https://opencode.de)
  and [CIVITAS CORE](https://www.civitasconnect.digital/civitas-core/)

Mapsight is an **embed-first communicative map framework**, not a full geoportal or GIS back-office replacement.

---

## Masterportal

[Masterportal](https://masterportal.org/) is a **monolithic geoportal toolkit** — one built SPA per portal instance,
configured through JSON/JS files. Originated in Hamburg (Geowerkstatt); OSGeo-listed; active community
on [opencode.de](https://discourse.opencode.de/t/ueber-die-kategorie-masterportal-projekt-413/1691).

**Shape:** full-page portal, not an npm embed library. **License:** MIT. **Stack (v3.x):** Vue 3 + Vuex, OpenLayers via
`@masterportal/masterportalapi`, optional Cesium 3D, Vite build, Vitest (E2E discontinued in 3.0).

**Configuration:** split across `config.js`, `config.json`, `services.json`, `rest-services.json`, `style.json` — OGC
service catalog centric; ~45 optional modules (routing, search, print, measure, layer tree, …).

**Integration model:** deploy static portal files; remote control via iframe `postMessage` → Vuex. No first-class CMS
snippet story in upstream docs.

**Strengths:** mature geoportal modules, 3D, i18next-based translations, MIT license, opencode.de community.

---

## Mapsight

**Shape:** npm packages (`@mapsight/core`, `@mapsight/ui`, …) + **embed API** for host apps and CMS. **License:
** [undecided](../LICENSING.md). **Stack:** React + Redux (core GIS runtime), OpenLayers, TypeScript + Zod, Vitest +
Playwright E2E goal.

**Configuration:** single serializable Redux tree per embed; GeoJSON-first feature sources; OGC layers as map layers.

**Integration model:** CMS HTML snippets, SPAs (`starters/mapsight-vite-spa-starter`, feature demos in `apps/showcase`),
Next (`starters/mapsight-next-starter`); optional SSR hydration; site transitions via `mergeAll` / `resetMapsightCore`.

**Strengths:** CMS-native embeds, **host-native theming** (map UI matches surrounding site —
see [Principles](../architecture/PRINCIPLES.md)), declarative JSON, TypeScript/Zod validation, Playwright E2E as quality
goal.

**Not current capabilities:** full geoportal module set, Cesium 3D, MapFish print, multi-backend search.

---

## Comparison

| Dimension        | Masterportal                               | Mapsight                                                                                       |
| ---------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Product shape    | Monolithic portal SPA                      | npm packages + embed API                                                                       |
| Framework        | Vue 3 + Vuex 4                             | React + Redux (core only)                                                                      |
| Config           | Split JSON files                           | Serializable Redux tree + Zod                                                                  |
| Data model       | OGC catalog primary; GeoJSON as layer type | GeoJSON-first; OGC as layers                                                                   |
| Deployment       | Full-page static portal                    | CMS snippets, SPA, Next                                                                        |
| Site transitions | Full portal page loads                     | MPA/SPA transitions without full reload                                                        |
| 3D               | Cesium built-in                            | Not current                                                                                    |
| Host branding    | Portal-wide Bootstrap / `style.json`       | Per-embed / per-host theming (USP)                                                             |
| Host control     | iframe postMessage → Vuex                  | `create()` / `browserEmbed`, dehydrated state                                                  |
| i18n             | i18next (JSON locales)                     | Per-embed `lang`; library TBD ([Decision 008](../architecture/decisions/008-i18n-approach.md)) |
| HTTP             | axios                                      | fetch + TanStack Query (target)                                                                |
| Testing          | Vitest; no E2E                             | Vitest + Playwright                                                                            |
| Typing           | JavaScript                                 | TypeScript + Zod                                                                               |
| License          | MIT                                        | Undecided                                                                                      |
| Community        | opencode.de, Bitbucket                     | GitHub ([open-mapsight](https://github.com/open-mapsight))                                     |

---

## When to choose which

| Need                                                                     | Lean toward                                                                |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Thematic map in a city website, campaign, or association site            | **Mapsight** embed or SPA                                                  |
| Map must **match host site** design (not look like a separate GIS app)   | **Mapsight**                                                               |
| Full geoportal: layer catalog, pro tools, OIDC layer sets, print         | **Masterportal** or CIVITAS geoportal slot                                 |
| GIS department data publishing                                           | **GeoServer / QGIS** — feeds both portal and embeds                        |
| Quick proprietary SaaS embed, minimal ops                                | Google/Mapbox — see [GIS stack choices § commercial](GIS_STACK_CHOICES.md) |
| Composable integration, multiple embeds per site, CMS editorial workflow | **Mapsight**                                                               |
| Single full-page portal replacing desktop GIS browsing for experts       | **Masterportal**                                                           |

If the primary user is a **resident or visitor** reading a **story on a web page**, prefer communicative embeds. If the
primary user is a **planner browsing a layer catalog**, prefer a geoportal.

---

## Interoperability

- **GeoServer** (and similar) publish WMS/WFS/GeoJSON — Mapsight **reads** layers; it does not replace geo department
  servers.
- **CIVITAS CORE** selected **Masterportal V3** as the standard geoportal component for
  V2 ([CIVITAS ADR 019 — Select Geoportal Component](https://docs.core.civitasconnect.digital/docs_v2/Architecture/Architecture_Decisions/Architecture_Decisions/019-select-geoportal-component/)).
  Mapsight targets the **communicative embed** channel, not that geoportal slot.

Mapsight does **not** aim to duplicate Masterportal’s ~45 modules.

---

## Commercial map stacks

Defaulting every communicative page to **Google Maps Platform** or **Mapbox** embeds brings billing, privacy, and
terms-of-use constraints — often a poor fit for **public money** or **data-trust-sensitive** hosts. Mapsight’s default
story is **self-hosted or municipal basemaps** + OSS frontend ([Ecosystem § basemaps](../architecture/ECOSYSTEM.md)).

Stakeholder and stack nuance: [GIS stack choices](GIS_STACK_CHOICES.md).

---

## CIVITAS CORE

|              | CIVITAS/CORE        | Masterportal | Mapsight                                                            |
| ------------ | ------------------- | ------------ | ------------------------------------------------------------------- |
| Code license | EUPL-1.2            | MIT          | Undecided ([blocker](../LICENSING.md) for formal ecosystem listing) |
| Docs license | CC-BY-SA 4.0        | —            | —                                                                   |
| PMPC stance  | Explicit on website | —            | TBD                                                                 |

**Geoportal (V1 and V2):** CIVITAS uses **Masterportal** in the geoportal presentation
layer — [CIVITAS ADR 019 (2025-11-06, Reviewed)](https://docs.core.civitasconnect.digital/docs_v2/Architecture/Architecture_Decisions/Architecture_Decisions/019-select-geoportal-component/).
Masterportal V3 is the default geoportal runtime; OGC-oriented integration with GeoServer and related services.

**Mapsight’s relationship:** **communicative CMS embeds** on host websites — a **different product channel** from the
CIVITAS geoportal. Typical municipal stacks may run **both**: Masterportal for pro users, Mapsight embeds for public
communicative pages. Both can consume the same GeoServer layers.

**Shared map engine:** both use OpenLayers ([Decision 002](../architecture/decisions/002-openlayers-over-maplibre.md)) —
common library, different products and integration models.

---

## Regional embed host (future)

Some anchor operators may someday offer **limited embeds to third-party local orgs** — **not productized today.
** [GIS stack choices § future feature](GIS_STACK_CHOICES.md#future-feature-regional-embed-host-program) · [Current vs target](../architecture/CURRENT_VS_TARGET.md).

---

## Related

- [GIS stack choices](GIS_STACK_CHOICES.md)
- [Principles](../architecture/PRINCIPLES.md)
- [Ecosystem](../architecture/ECOSYSTEM.md)
- [Integration overview](../integration/OVERVIEW.md)
- [Licensing](../LICENSING.md)
