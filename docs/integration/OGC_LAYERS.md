# OGC overlay layers (WMS / WFS)

Mapsight **consumes** OGC services published by geo departments (typically GeoServer). This guide covers **thematic
overlays and raster layers** in `map.layers`.

**Not covered here:** XYZ **basemap** tiles and [tile-proxy](TILE_PROXY.md) — those are separate basemap patterns (
see [Ecosystem § basemaps](../architecture/ECOSYSTEM.md)).

---

## WMS raster overlay

Use when GeoServer (or similar) publishes a raster or map image layer.

Integrator adds a tiled WMS layer in embed config: a `TileLayer` with a `TileWMSSource`:

```json
{
	"map": {
		"layers": {
			"city_overlay": {
				"type": "TileLayer",
				"options": {
					"visible": true,
					"source": {
						"type": "TileWMSSource",
						"options": {
							"url": "https://geo.example.org/geoserver/wms",
							"params": {
								"LAYERS": "workspace:layer_name",
								"TILED": true
							}
						}
					}
				}
			}
		}
	}
}
```

The `wms()` helper from `@mapsight/ui/config/map/layers` builds this shape (`wms(url, params, projection, visible,
metaData, opacity)`).

Confirm layer name, workspace, and supported CRS with the GIS team.

Other source types, for example `XYZSource`, exist as definitions in `@mapsight/core/ol-proxy/definitions/source/*`,
but only the defaults of the `ol-proxy` plugin are registered. Register further definitions through
`createOlProxyPlugin({dependencies: [...]})` (see `packages/ui/src/js/plugins/common/ol-proxy.ts`).

---

## WFS → GeoJSON

Mapsight’s primary feature model is **GeoJSON
** ([Decision 003](../architecture/decisions/003-geojson-first-data-model.md)).
Common patterns:

1. **GeoServer WFS** → export/schedules to static GeoJSON → `featureSources` URL ([PUBLISHING_DATA](PUBLISHING_DATA.md))
2. **Server-side transform** (pulp, custom script) → GeoJSON consumed by embed
3. **WFS in browser** — only when the service supports CORS and payload size is acceptable (uncommon for large layers)

Prefer static GeoJSON or server-prepared files for communicative embeds.

---

## CORS and internal GeoServer

Browsers block cross-origin WMS/WFS unless GeoServer sends CORS headers or the layer is **same-origin**.

| Situation                    | Approach                                                         |
| ---------------------------- | ---------------------------------------------------------------- |
| GeoServer public with CORS   | Direct layer URL in config                                       |
| GeoServer internal only      | Reverse proxy on CMS host (`/geoserver/…`)                       |
| Masterportal-style OGC proxy | Geoportal proxy — different from XYZ [tile-proxy](TILE_PROXY.md) |

Document the public URL integrators must use after proxy setup.

---

## Shared layers with geoportal

The same GeoServer layer can feed **Masterportal** (service catalog) and **Mapsight embeds** (overlay or exported
GeoJSON). See [Coexistence](../ecosystem/COEXISTENCE.md).

---

## Related

- [Publishing data](PUBLISHING_DATA.md)
- [Config reference](CONFIG_REFERENCE.md)
- [Ecosystem](../architecture/ECOSYSTEM.md)
