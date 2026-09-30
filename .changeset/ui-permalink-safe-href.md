---
"@mapsight/ui": patch
---

Only resolve feature permalinks to `http:`, `https:`, or relative URLs. Unsafe `permanentLink` properties fall back to the location-based permalink, and unsafe `permalink` config results resolve to no permalink.
