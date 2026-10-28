---
"@mapsight/core": patch
"@mapsight/ui": minor
---

Respect reduced motion in core map transitions, feature fits, keyboard pan/zoom, and UI scrolling. Add opt-in PointInputControls with a focused-map keyboard path and explicit confirmation through the editor's point source.

Preserve point source CRS and collection metadata, retain original fit destinations and exactly-once OL callbacks across motion changes, and finish concurrent/keyboard transitions without cancelling unrelated work. Allow SSR-safe address search inside host forms with `uiState.searchRenderForm: false`.
