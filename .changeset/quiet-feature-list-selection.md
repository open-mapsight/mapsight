---
"@mapsight/ui": patch
---

Avoid rerendering unrelated standard and legacy feature-list rows when selection starts or clears with `showSelectedOnly` disabled. Preserve selected-only visibility and the existing global selection result for direct hook callers.
