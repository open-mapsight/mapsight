---
"@mapsight/lib-ol": patch
---

Skip OpenLayers `Icon` construction when `icon` is `none` or `src` is empty so area styles can still paint.
