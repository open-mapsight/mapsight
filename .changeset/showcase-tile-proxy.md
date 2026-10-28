---
"@mapsight/showcase": patch
---

Serve deployed basemap tiles through the same-origin tile proxy. Main and PR preview builds set `VITE_SHOWCASE_OSM_TILE_URL` to `/tiles/osm/{z}/{x}/{y}.png`, so visitors' browsers no longer request tiles from tile.openstreetmap.org. Local development keeps direct OSM tiles.
