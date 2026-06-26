# GIS stack choices

Choose the right map **product channel** and **technology stack** — municipalities, Stadtmarketing, commercial hosts,
clubs, NGOs.

For **deployment topology** (CMS, pulp, platform, GeoServer, tile sources),
see [Technical ecosystem](../architecture/ECOSYSTEM.md). For **Masterportal vs Mapsight**,
see [Positioning](POSITIONING.md).

---

## Two questions

1. **Who is the map for?** → [Three product channels](#three-product-channels)
2. **What software runs where?** → [Ecosystem](../architecture/ECOSYSTEM.md)

---

## Three product channels

| Channel                    | Audience                                            | Typical product                                              | Mapsight                                               |
| -------------------------- | --------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------ |
| **Communicative maps**     | Residents, visitors, road users, campaign audiences | Thematic embeds in CMS pages, traffic info sites, microsites | **Primary scope**                                      |
| **Geoportal / Fachportal** | Planners, contractors, GIS power users              | Masterportal, CIVITAS geoportal slot, Lizmap                 | **Adjacent** — different product                       |
| **GIS back-office**        | Data stewards, analysts                             | QGIS Desktop, GeoServer admin, ETL                           | **Out of scope** — publishes data Mapsight may consume |

GIS back-office publishes layers → communicative maps and/or geoportals **display** them. A city may run communicative
Mapsight embeds **and** a separate geoportal.

Production hosts sometimes add **proprietary extensions** (routing, traffic modules, custom presets) on top of the OSS
core — those are not part of the public monorepo.

---

## Mapsight’s lane

**Communicative, embeddable thematic maps** that **blend into the host site
** ([host-native theming](../architecture/PRINCIPLES.md)).

Examples: CMS city maps, traffic and roadwork maps, construction routing, campaign microsites, round tours, event
locators, count-aggregator dashboards, association trail maps.

Any host with a website or app can integrate the OSS packages — not Kommune-only.

---

## When a geoportal is the right answer

Choose a **geoportal** (Masterportal, CIVITAS slot, QGIS Server portal, ArcGIS Enterprise Portal) when users need:

- Layer **catalog** browsing with metadata
- Authenticated **layer sets** (OIDC / Keycloak)
- Pro tools: advanced search, print layouts, 3D, routing (module-dependent)
- Self-service for **GIS professionals** and contractors

Usually **municipality / CIVITAS** — rarely Stadtmarketing, Verein, or small commercial sites telling a simple story.

Product comparison: [Positioning](POSITIONING.md).

---

## Stakeholder matrix

| Stakeholder                                                                             | Typical use cases                                                                               | Host pattern                                    | Geoportal needed?      | Mapsight fit                                                                   |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| **Municipality / public administration**                                                | Resident info, participation, smart city, city plan                                             | City CMS, maps subdomain                        | Sometimes (GIS dept)   | **Strong**                                                                     |
| **Traffic / mobility public bodies** (VMZ, road authority, regional traffic management) | Roadworks, diversions, construction routing, live traffic layers, regional traffic storytelling | Maps subdomain, CMS or dedicated traffic portal | Rarely                 | **Strong** — often with proprietary routing/traffic modules alongside OSS core |
| **Stadtmarketing / tourism / culture**                                                  | Event maps, round tours, audio-guide routes, festival wayfinding                                | SPA, CMS embed, partner iframe                  | Rarely                 | **Strong** — thematic UX without geoportal overhead                            |
| **Commercial companies**                                                                | Store locators, logistics views, property marketing                                             | Own web app, marketing site embed               | No                     | **Valid** — OSS embed + self-hosted data                                       |
| **Clubs, NGOs, Vereine**                                                                | Trail maps, facility finders, community projects                                                | WordPress, static site, association CMS         | No                     | **Strong** — lightweight embed                                                 |
| **GIS department (internal)**                                                           | Layer catalog, analysis prep, stewardship                                                       | GeoServer, desktop GIS, optional geoportal      | Often (for catalog UI) | **Consumer** of WMS/WFS/GeoJSON — not replacement                              |

---

## Future feature: regional embed host program

An anchor operator (city, VMZ, regional mobility agency) that **already runs Mapsight** could someday offer **limited
embeds or static map exports to third parties** — multi-tenant presets, quotas, snippet builder.

**Not productized today.**

---

## Product-type comparison

| Approach                             | Typical use                           | Open / sovereign                             | CMS or embed                          | Pro geoportal tools      | Mapsight stance                                                |
| ------------------------------------ | ------------------------------------- | -------------------------------------------- | ------------------------------------- | ------------------------ | -------------------------------------------------------------- |
| **Mapsight + host site**             | Communicative maps (all stakeholders) | Strong (OSS; [license TBD](../LICENSING.md)) | **Native embed**; host-native theming | No                       | **Primary product**                                            |
| **GeoServer (+ PostGIS)**            | OGC layer publishing                  | Strong (OSS)                                 | N/A (server)                          | Feeds geoportal & embeds | **Use together** — data layer                                  |
| **Masterportal / CIVITAS geoportal** | Municipal geoportal                   | Strong (EUPL/MIT)                            | Weak (full-page portal)               | Partial                  | **Adjacent** — not duplicate                                   |
| **ArcGIS Enterprise / Online**       | Enterprise GIS + portal               | Proprietary                                  | Costly embed path                     | Strong                   | Optional **data source** (REST/WMS)                            |
| **Google Maps Platform**             | Quick SaaS embeds                     | Weak (ToS, billing)                          | iframe/JS                             | No                       | **Avoid as default** for PMPC/trust-sensitive hosts            |
| **Mapbox GL / tiles**                | Styled web maps                       | Weak (API billing)                           | Possible                              | No                       | **Avoid as default basemap** — prefer self-hosted/OSM patterns |
| **QGIS Desktop**                     | Analysis, cartography                 | Strong (GPL)                                 | N/A                                   | N/A                      | **Publish** GeoJSON/WMS for Mapsight                           |
| **QGIS Server / Lizmap**             | Self-hosted geoportal                 | Strong                                       | Varies                                | Partial                  | Different category — geoportal, not embed framework            |

---

## Privacy and basemaps

Communicative maps need a **basemap** under thematic layers. Mapsight does **not** ship one — hosts choose sources in
config. See [Ecosystem § basemap patterns](../architecture/ECOSYSTEM.md):

| Pattern                   | Summary                                                                                         | Guide                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Tile proxy**            | Same-origin `/tiles/…`; cache and optional transform — preferred for production municipal hosts | [TILE_PROXY.md](../integration/TILE_PROXY.md) |
| **Direct XYZ**            | OSM, basemap.de, vendor tiles — OK with ToS, attribution, rate limits                           | [Ecosystem](../architecture/ECOSYSTEM.md)     |
| **GeoServer WMS**         | Official municipal raster basemap                                                               | [Ecosystem](../architecture/ECOSYSTEM.md)     |
| **Municipal tile server** | Geo dept XYZ/WMTS, often fronted by proxy                                                       | [TILE_PROXY.md](../integration/TILE_PROXY.md) |

For **trust-sensitive** hosts (PMPC, privacy policy, no third-party trackers), prefer **same-origin tile proxy** or \*
\*self-hosted/municipal\*\* basemaps over browser-direct calls to global SaaS tile APIs.

---

## Glossary

| Term                    | Meaning                                                                           | Mapsight                                    |
| ----------------------- | --------------------------------------------------------------------------------- | ------------------------------------------- |
| **Communicative map**   | Thematic map for broad audiences in host content                                  | **Primary scope**                           |
| **Fachportal**          | German term for specialist / geo portal                                           | Often a **geoportal** channel               |
| **Feature source**      | Config slice loading GeoJSON/API data into the map                                | `featureSources` in embed JSON              |
| **Geoportal (product)** | Full-page portal: layer tree, metadata, GFI, print, OIDC                          | Adjacent channel — not main product shape   |
| **Infosite**            | Java CMS product common in German municipalities                                  | CMS layer — embed guide **stub**            |
| **Kommune**             | Municipality / municipal administration                                           | Common host type                            |
| **Masterportal**        | OSS geoportal reference (CIVITAS v1 default)                                      | [Positioning](POSITIONING.md)               |
| **MPA**                 | Multi-page application (full page loads between URLs)                             | CMS embeds often live in MPA sites          |
| **PMPC**                | Public Money, Public Code                                                         | Licensing / procurement context             |
| **Preset**              | Host factory function returning `browserEmbed` options                            | e.g. `simpleMap()` in mapsight-host-starter |
| **pulp**                | [mapsight-pulp](https://github.com/open-mapsight/mapsight-pulp) — PHP GeoJSON ETL | Optional data layer                         |
| **Stadtmarketing**      | City marketing / tourism organisations                                            | Common communicative-map sponsor            |
| **VMZ**                 | Regional marketing centre (often anchor city)                                     | May host embed programs for Vereine         |
| **GeoServer**           | OGC WMS/WFS server                                                                | **Complement** — Mapsight reads layers      |

---

## Related

- [Positioning](POSITIONING.md)
- [Principles](../architecture/PRINCIPLES.md)
- [Ecosystem](../architecture/ECOSYSTEM.md)
- [Integration overview](../integration/OVERVIEW.md)
- [Decision 010 — Audience scope](../architecture/decisions/010-audience-scope.md)
