---
"@mapsight/ui": patch
---

Fix the default projection of `wms()` layers. The default was misspelled (`ESPG:3857`), so OpenLayers did not recognize it and the WMS source followed the map view projection. WMS tiles are now requested in `EPSG:3857` by default. If your map view uses a different projection and you want WMS requests in that projection, pass it explicitly as the third argument of `wms()`.
