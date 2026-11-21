---
"@mapsight/core": patch
---

Config validation messages now describe the most relevant branch of a failed union with its full path instead of a generic "Invalid input", and a string `options.source` on a `MapboxVectorLayer` points to `options.sourceId`. Which configs pass or fail validation is unchanged.
