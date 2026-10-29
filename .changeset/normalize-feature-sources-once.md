---
"@mapsight/core": patch
---

Validate immutable feature-source objects once and normalize only sources that need runtime fields. Adding or reconfiguring one source no longer rehashes all loaded GeoJSON or replaces unrelated source objects.
