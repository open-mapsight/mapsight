---
"@mapsight/core": minor
---

The `WMTSSource` ol-proxy definition now accepts `layer`, `style` and `requestEncoding` and builds its tile grid from a plain JSON description (`origin`/`origins`, `resolutions`, `matrixIds`, `tileSize`/`tileSizes` and optionally `extent`, `sizes`, `tileRanges`), so WMTS layers can be configured as JSON. Tile grid instances are still accepted. The description is validated before the source is created (`validateWMTSTileGridDescription` and `createWMTSTileGrid` are exported); an invalid or missing tile grid logs one error and no source is created. `tileRanges` take precedence over `extent`. The `dimensions` object is copied instead of being handed to OpenLayers, so frozen config is never mutated, and changing or removing a dimension creates a new source.
