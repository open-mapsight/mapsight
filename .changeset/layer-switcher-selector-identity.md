---
"@mapsight/core": patch
---

Keep integrated and external layer-switcher id arrays stable across map view updates and layer changes that leave switcher membership and order unchanged. Memoize filtering from the layers state instead of allocating arrays in input selectors, avoiding unnecessary renders in layer switchers.
