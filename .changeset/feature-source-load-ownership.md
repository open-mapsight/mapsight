---
"@mapsight/core": patch
---

Ignore obsolete feature-source load completions after URL/type replacement,
removal, a newer request, or an intervening data edit. Clear retired lookup,
loading, error and history metadata with the old collection so the replacement
can load immediately, while preserving refresh configuration and manual
completion action compatibility.
