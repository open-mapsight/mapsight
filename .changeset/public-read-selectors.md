---
"@mapsight/core": minor
---

Add supported read selectors for host applications: map view (`viewSelector`, `viewCenterSelector`, `viewZoomSelector`, `viewRotationSelector`, `viewResolutionSelector`, `viewExtentSelector`) and feature sources (`hasFeatureSourceLocalEdits`, `hasFeatureSourceFeatureId`). `MapState` now has a typed optional `view` (`MapViewState`). The Redux architecture guide lists the supported selectors; state paths without a selector are internal.
