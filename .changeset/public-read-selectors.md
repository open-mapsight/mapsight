---
"@mapsight/core": minor
---

Add supported read selectors for host applications: map view (`viewSelector`, `viewCenterSelector`, `viewZoomSelector`, `viewRotationSelector`, `viewResolutionSelector`, `viewExtentSelector`) and feature sources (`hasFeatureSourceLocalEdits`, `hasFeatureSourceFeatureId`). The exported `MapViewState` type describes what `viewSelector` returns; `MapState` itself is unchanged. `viewExtentSelector` returns the visible extent in the coordinate system of the view center, which is the user projection when one is set (for example via `useGeographic()`). The Redux architecture guide lists the supported selectors; state paths without a selector are internal.
