---
"@mapsight/core": minor
---

`MapboxVectorLayer` accepts an initial `styleTransforms` option that applies `setLayerProperties` transforms (in the tile-proxy format, with stricter validation) to the style document in the browser. The transform function is also exported as `applyMapboxStyleTransforms` from `@mapsight/core/ol-proxy/definitions/layer/mapboxStyleTransforms`. Layers without `styleTransforms` behave as before. A disposed `MapboxVectorLayer` now cancels its pending style load and no longer gets a source attached when that load finishes.
