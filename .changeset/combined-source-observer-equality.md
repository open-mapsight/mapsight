---
"@mapsight/core": patch
---

Avoid repeatedly comparing unchanged combined-source results after a member is replaced with equal feature data. Combined sources still retain their previous data for equal replacements and update when member contents, errors, or bindings change.
