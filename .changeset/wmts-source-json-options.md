---
"@mapsight/core": minor
---

The `WMTSSource` ol-proxy definition now accepts `layer`, `style` and `requestEncoding` and builds its tile grid from a plain JSON description (`origin`/`origins`, `resolutions`, `matrixIds`, `tileSize`/`tileSizes` and optionally `extent`, `sizes`, `tileRanges`), so WMTS layers can be configured as JSON. Tile grid instances are still accepted.
