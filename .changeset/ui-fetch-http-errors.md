---
"@mapsight/ui": patch
---

Treat HTTP error responses as failures in `fetchText` / `fetchJson`, so 404 or 502 error pages no longer render as feature details. Network errors now dispatch a single failure carrying the original error.
