---
"@mapsight/core": patch
---

Index feature IDs such as constructor, toString and **proto** as ordinary own
entries in runtime and filtered feature lookups. Preserve first-feature lookup
semantics for duplicate IDs, including after full or compact SSR hydration.
