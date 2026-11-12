---
"@mapsight/core": minor
---

`MapboxVectorLayer` accepts an initial `styleTransforms` option that applies tile-proxy compatible `setLayerProperties` transforms to the style document in the browser. The transform function is also exported as `applyMapboxStyleTransforms` from `@mapsight/core/ol-proxy/definitions/layer/mapboxStyleTransforms`. Layers without `styleTransforms` behave as before.
