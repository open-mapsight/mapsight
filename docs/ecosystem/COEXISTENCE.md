# Masterportal and Mapsight coexistence

Same organisation, **different product channels** — not a fork-or-merge choice.

| Channel                 | Typical surface                     | Product                               |
| ----------------------- | ----------------------------------- | ------------------------------------- |
| **Geoportal**           | Full-page portal (`/geoportal/…`)   | Masterportal / CIVITAS geoportal slot |
| **Communicative embed** | CMS pages, campaigns, thematic maps | **Mapsight** (primary scope)          |

See [GIS stack choices](../ecosystem/GIS_STACK_CHOICES.md) for stakeholder framing and [Positioning](POSITIONING.md) for
capability comparison.

---

## Shared GeoServer

Publish layers once in GeoServer (or equivalent):

- **Geoportal** — Masterportal service catalog (`services.json`, WMS/WFS endpoints)
- **Mapsight embeds** — GeoJSON URLs in `featureSources`, WMS overlays in `map.layers`, or pulp exports

No requirement to duplicate ETL or maintain two canonical datasets.

Handoff details: [Publishing data](../integration/PUBLISHING_DATA.md), [OGC layers](../integration/OGC_LAYERS.md).

---

## Basemap policy

Geoportal and embeds may use **different basemap URLs** and attribution blocks. Align **privacy policy** and
visitor-facing attribution across both surfaces.

Basemap patterns: [Ecosystem § basemaps](../architecture/ECOSYSTEM.md).

---

## Out of Mapsight scope

Use the geoportal product when the primary journey needs:

- Layer catalog browsing for experts
- OIDC-controlled layer entitlements
- MapFish print, Cesium 3D, routing modules
- Masterportal’s full module set (~45 optional modules)

Mapsight targets **resident/visitor communicative** pages embedded in host content.

---

## Related

- [Positioning](POSITIONING.md)
- [Integration overview](../integration/OVERVIEW.md)
- [Principles](../architecture/PRINCIPLES.md)
