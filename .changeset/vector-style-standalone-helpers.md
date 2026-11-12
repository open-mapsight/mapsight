---
"@mapsight/vector-style-compiler": patch
"@mapsight/traffic-style": patch
---

Generated style modules no longer import `@mapsight/lib-js`. The small path and replace helpers are now emitted inline, and only when a style uses them. After regenerating your styles you can remove a direct `@mapsight/lib-js` dependency from your application if nothing else needs it.
