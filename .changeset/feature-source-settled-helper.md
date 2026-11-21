---
"@mapsight/core": minor
---

Add `getFeatureSourceLoadState` (`@mapsight/core/lib/feature-sources/load-state`) and `whenFeatureSourcesSettled` / `whenFeatureSourceSettled` (`@mapsight/core/lib/feature-sources/when-settled`) so host code can wait for the data of feature sources without watching actions. `load()` and `dispatch` behave as before.
