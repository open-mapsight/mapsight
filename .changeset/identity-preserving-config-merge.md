---
"@mapsight/lib-redux": minor
"@mapsight/core": minor
"@mapsight/ui": patch
---

Preserve unchanged loaded feature data and derived indexes when applying JSON-style configuration. Add opt-in `mergeConfig`/`mergeConfigAll` actions and use them in `resetMapsightCore`, retaining selection resets, path routing and existing deep-merge value semantics.
