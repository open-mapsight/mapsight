---
"@mapsight/core": patch
---

Reuse combined feature-source results while member feature arrays are unchanged, avoiding array copies and deep observer comparisons during map interactions. Build changed combinations in a single pass.
