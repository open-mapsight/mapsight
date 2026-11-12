# Publishing data for Mapsight embeds

Guide for **GIS / data stewards** handing off thematic layers to web teams. Mapsight **consumes** published data — it
does not replace GeoServer, QGIS, or your ETL pipeline.

---

## What web needs from you

| Deliverable         | Description                                                                   |
| ------------------- | ----------------------------------------------------------------------------- |
| **Accessible URL**  | HTTPS URL the browser can `GET` (or documented proxy path)                    |
| **Format**          | GeoJSON `FeatureCollection` preferred for thematic points/lines/polygons      |
| **CRS**             | **EPSG:4326** (WGS84 lon/lat) unless integrator configures another projection |
| **Update cadence**  | How often data changes; who triggers republish                                |
| **Attribution**     | Text/links required in map or page copy                                       |
| **Property schema** | Field names for list, filter, and popup UI (see below)                        |

Hand off using the checklist at the end of this page.

---

## GeoJSON contract

### Geometry

- Valid GeoJSON per [RFC 7946](https://datatracker.ietf.org/doc/html/rfc7946)
- Prefer `FeatureCollection` with stable feature `id` (property or Feature `id`)
- Feature ids must be **unique across all feature sources of one Mapsight instance** and should be **strings**.
  Selections store only feature ids, and the lookup returns the first source that contains the id. If datasets number
  their features independently, prefix the ids per source in the data pipeline (for example `poi-17`, `event-17`).
- Coordinates in **longitude, latitude** order for EPSG:4326

### Properties for Mapsight UI

Common fields consumed by list and filter UI (names are convention — agree with integrator):

| Property          | Used for                                         |
| ----------------- | ------------------------------------------------ |
| `name`            | List title, popup heading                        |
| `listInformation` | List subtitle / summary line                     |
| `mapsightIconId`  | Icon from host style bundle                      |
| `description`     | Popup HTML (sanitize before publish if from CMS) |
| `tagGroups`       | Tag filter UI (nested groups → tags)             |

See a working example in [
`starters/mapsight-host-starter/public/data/demo.geojson`](../../starters/mapsight-host-starter/public/data/demo.geojson).

### Size and performance

| Guideline               | Recommendation                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------- |
| Browser `xhr-json` load | Keep **under ~5–10 MB** uncompressed where possible                                   |
| Larger datasets         | Split by region/theme, simplify geometry, or serve via [pulp](PULP.md) / platform API |
| Refresh                 | Set cache headers on static files; document expected staleness                        |

---

## OGC layers (WMS / WFS)

Raster overlays and WFS-backed layers are configured in **`map.layers`**, not `featureSources`. Steward publishes in
GeoServer; integrator wires WMS/WFS URLs — see [OGC_LAYERS](OGC_LAYERS.md).

---

## Publishing paths

| Pattern                                            | When                                                                  |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| **Static GeoJSON file** on web server or CMS media | Small/medium datasets, infrequent updates                             |
| **mapsight-pulp** scheduled job                    | Feeds, transforms, KML→GeoJSON — [PULP](PULP.md)                      |
| **Platform API**                                   | Time-series, admin-managed stations — [DATA_BACKEND](DATA_BACKEND.md) |

---

## Handoff checklist

- [ ] GeoJSON URL(s) reachable from **public web** (or documented reverse proxy)
- [ ] CRS documented (default EPSG:4326)
- [ ] Sample file attached or linked for schema review
- [ ] Property field dictionary shared with web team
- [ ] Attribution text agreed
- [ ] Update process defined (who runs pulp / upload, how often)
- [ ] CORS confirmed if cross-origin (or same-origin proxy planned)

---

## Related

- [OGC layers](OGC_LAYERS.md)
- [Ecosystem § data flow](../architecture/ECOSYSTEM.md)
- [Integration overview](OVERVIEW.md)
- [Decision 003 — GeoJSON-first](../architecture/decisions/003-geojson-first-data-model.md)
