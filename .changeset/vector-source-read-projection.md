---
"@mapsight/core": patch
---

Read feature collections without a `crs` in the vector source's configured `projection`, the projection its own writes use, and fall back to EPSG:4326 only when none is configured. Previously the configured projection was ignored when reading, so an editor with a non-geographic `projection` misplaced the features it had just written. A named `crs` still takes precedence.
