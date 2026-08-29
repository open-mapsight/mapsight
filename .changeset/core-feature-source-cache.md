---
"@mapsight/core": patch
"@mapsight/ui": patch
---

Add an opt-in FeatureSourceCache seam so xhr-json loads can reuse a process-memory (or later IDB) document cache keyed by URL and revision
