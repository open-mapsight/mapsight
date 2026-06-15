---
"@mapsight/ui": patch
---

Stop initializing runtime-only feature source state in UI feature source config
helpers.

The helpers now return only feature source configuration fields and rely on the
core runtime state normalization introduced in
https://github.com/open-mapsight/mapsight/commit/6cd6e11ffe73633eeb55f8e02425748baefe385d
to populate `data`, `lastUpdate`, and `lastActionType`.
