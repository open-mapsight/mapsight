---
"@mapsight/core": patch
---

Run the map's first feature hit detection while the page is idle. OpenLayers 10 benchmarks canvas reads on the first hit detection of a rendered vector layer (three 50 ms busy loops in `ExecutorGroup`), which froze the user's first hover or tap on the map for ~150 ms. Maps with feature interactions now trigger it once after a visible vector layer with features has rendered.
