---
"@mapsight/ui": patch
---

Stop re-rendering the split base-layer switcher and all its entries on every Redux dispatch. Its state selector recomputed and returned new layer id arrays each time (map view updates while panning included); it now memoises per instance and keeps the previous result while the split is unchanged. Collapsible overlay groups are memoised and get a stable toggle handler.
