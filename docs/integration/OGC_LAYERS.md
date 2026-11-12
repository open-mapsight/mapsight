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

## WMTS

Use a `WMTSSource` for cached tile services (WMTS). Like all layer config it is plain JSON; the `WMTSSource` ol-proxy
definition builds the OpenLayers source and its tile grid from it.

```json
{
	"map": {
		"layers": {
			"city_tiles": {
				"type": "TileLayer",
				"options": {
					"source": {
						"type": "WMTSSource",
						"options": {
							"urls": ["https://tiles.example.org/wmts?"],
							"layer": "basemap",
							"style": "default",
							"matrixSet": "webmercator",
							"format": "image/png",
							"requestEncoding": "KVP",
							"projection": "EPSG:3857",
							"tileGrid": {
								"origin": [
									-20037508.342789244, 20037508.342789244
								],
								"resolutions": [
									156543.03392804097, 78271.51696402048,
									39135.75848201024
								],
								"matrixIds": ["0", "1", "2"],
								"tileSize": 256
							}
						}
					}
				}
			}
		}
	}
}
```

| Option                        | Meaning                                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layer`, `style`, `matrixSet` | Identifiers as advertised in the capabilities (all three are required).                                                                           |
| `requestEncoding`             | `"KVP"` (default) or `"REST"`.                                                                                                                    |
| `url` / `urls`                | KVP: the service URL. REST: a URL template with `{layer}`, `{style}`, `{TileMatrixSet}`, `{TileMatrix}`, `{TileCol}`, `{TileRow}` and dimensions. |
| `format`                      | Image format, for KVP requests (default `image/jpeg`). Put the file extension into the template for REST.                                         |
| `version`                     | WMTS version for KVP requests (default `1.0.0`).                                                                                                  |
| `dimensions`                  | Object of dimension values, for example `{"time": "2020"}`.                                                                                       |
| `projection`                  | Projection code of the matrix set. Codes beyond `EPSG:3857` and `EPSG:4326` must be registered (proj4) first.                                     |
| `tileGrid`                    | The tile matrices, described below.                                                                                                               |
| `wrapX`, `crossOrigin`        | The usual tile source options.                                                                                                                    |

`tileGrid` describes the tile matrices of the matrix set, one entry per matrix (zoom level) in the same order:

- `resolutions` and `matrixIds` (required, same length): map units per pixel and the `TileMatrix` identifier.
- `origin` (one top left corner for all matrices) or `origins` (one per matrix), as `[x, y]` in the projection's x/y
  order. Services with lat/long axis order (such as `EPSG:4326`) list the corner as `[lat, lon]` in their capabilities:
  swap it here.
- `tileSize` or `tileSizes`: pixels, a number or `[width, height]`.
- Optional: `sizes` (`[matrixWidth, matrixHeight]` per matrix), `tileRanges` (`[minCol, maxCol, minRow, maxRow]` per
  matrix, for tile matrix limits) and `extent`, which restrict the requested tiles.

An `ol/tilegrid/WMTS` instance is still accepted as `tileGrid` when the layer is created in code.

The definition is not part of the default set. Register it with the ol-proxy plugin:

```ts
import createOlProxyPlugin from "@mapsight/ui/plugins/common/ol-proxy";

import WMTSSource from "@mapsight/core/ol-proxy/definitions/source/WMTSSource";

createOlProxyPlugin({dependencies: [WMTSSource]});
```

With `createDefaultPlugins` pass the same through `{olProxy: {dependencies: [WMTSSource]}}`.

---

## From capabilities to layer config

Instead of writing WMS and WMTS layer options by hand, two pure helpers in `@mapsight/ui` turn a `GetCapabilities`
document into layer config. They read the document and return data; they never fetch anything.

```ts
import {wmsCapabilitiesToLayers} from "@mapsight/ui/config/ogc/wms";
import {wmtsCapabilitiesToLayers} from "@mapsight/ui/config/ogc/wmts";

// the host application loads the document
const xml = await (
	await fetch(
		"https://geo.example.org/geoserver/wms?service=WMS&request=GetCapabilities",
	)
).text();

const layers = wmsCapabilitiesToLayers(xml, {projection: "EPSG:3857"});
// [{name, title, abstract?, geographicBoundingBox?, crs, styles, queryable, attribution?, definition}, ...]

const chosen = layers.find((layer) => layer.name === "workspace:layer_name")!;
const mapLayers = {
	city_overlay: {
		...chosen.definition,
		// optional, set by you: text from the document is untrusted (see below)
		metaData: {title: "City overlay"},
	},
};
```

`wmtsCapabilitiesToLayers(xml, options)` works the same way for WMTS and returns `{name, title, abstract?,
geographicBoundingBox?, crs, matrixSets, styles, formats, definition}` per layer.

`wmsCapabilitiesToLayers(capabilities, options?)`:

- One entry per **named** layer, nested layers flattened. CRS and style names are added to those of the parent layers; the
  geographic bounding box, attribution and `queryable` are inherited unless the layer sets its own (see "Inheritance of
  layer properties" in the WMS specification).
- `definition` is a `TileLayer` with a `TileWMSSource`: the `GetMap` URL from the capabilities and `params` with `LAYERS`,
  `VERSION`, `FORMAT` and `TRANSPARENT`.
- Options: `url` replaces the advertised `GetMap` URL, `format` (default: an advertised format, preferring PNG) and
  `projection` (sets the source projection and leaves out layers that do not advertise the CRS).

`wmtsCapabilitiesToLayers(capabilities, options?)`:

- One entry per layer. `definition` is a `TileLayer` with a `WMTSSource` as described above: layer, style, matrix set,
  format, request encoding, `urls`, projection code, tile grid and the default dimension values.
- Options: `matrixSet` (leaves out layers that are not published in it), `projection` (preferred projection used to
  choose a layer's matrix set, default `EPSG:3857`) and `style` (leaves out layers without it).
- Needs the `WMTSSource` definition to be registered (see above); the WMS definitions are part of the default set.

Things to know:

- **Fetching stays with the host application.** The helpers take the XML string (or an object parsed with
  `ol/format/WMSCapabilities` / `ol/format/WMTSCapabilities`). Loading it, CORS, authentication and a reverse proxy
  (see [CORS and internal GeoServer](#cors-and-internal-geoserver)) are your job; use the `url` option of the WMS helper
  if clients must not talk to the address the service advertises.
- **Parsing XML needs a DOM** (`DOMParser`): fine in browsers and in jsdom, not in plain Node.js. There, parse the
  document with a DOM implementation of your choice and pass the XML string or parsed object.
- **Text from the document is untrusted.** Titles, abstracts, style names and attribution are returned as plain data
  fields only. The helpers never write them to `metaData.attribution`, legends or other fields Mapsight may render as
  HTML, and the generated definitions carry no `metaData` at all. If you copy such a string into `metaData`, make sure
  your UI renders it as text, never as HTML.
- **Plain JSON.** The definitions can be stored in Redux state and in embed config as they are.
- Layers for which no usable source can be derived (for example a tile matrix set in a projection that is not
  registered, or a tile URL that is not `http(s)`) are left out of the WMTS result. Register additional projections
  before calling the helper.
- When you pass an already **parsed WMS object**, `queryable` is only known for the layer's own `queryable` attribute:
  the OpenLayers parser drops the attribute on layers that have child layers, so inheritance can only be resolved from the
  XML string.

---

## Related

- [Publishing data](PUBLISHING_DATA.md)
- [Config reference](CONFIG_REFERENCE.md)
- [Ecosystem](../architecture/ECOSYSTEM.md)
