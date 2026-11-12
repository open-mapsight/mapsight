---
"@mapsight/core": minor
---

Add `removeKey(path)`, `removeLayer(controllerName, layerId)` and `removeFeatureSource(controllerName, id)` so a host application can remove a single layer or feature source at runtime. `removeLayer` leaves the layer's feature source and all selections untouched. Reducers, controllers and selectors now skip `undefined` layer and source entries, so `unset` of a layer or source no longer throws. Late actions for a source id that is no longer in the state are ignored. Requires the matching `@mapsight/lib-redux` release.
