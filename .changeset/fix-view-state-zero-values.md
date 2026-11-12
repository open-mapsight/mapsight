---
"@mapsight/core": patch
---

Fix the map view state ignoring zero values: after rotating a map back to exactly 0 the stored `view.rotation` kept the previous angle, and zoom level 0 was never written. The map controller now writes every defined zoom, resolution and rotation. Host code that read a stale rotation or an unset zoom at level 0 now sees the actual values.
