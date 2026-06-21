---
"@mapsight/core": patch
"@mapsight/ui": patch
---

Stop xhr-json feature source autoload loops on HTTP errors with empty status text (for example 404 during partial deploys).
