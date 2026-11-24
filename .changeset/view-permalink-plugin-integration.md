---
"@mapsight/ui": patch
---

The share position link plugin no longer recentres or rezooms the map for a marker link when another plugin has fixed the initial view from the page address (new optional `initialViewFromAddress` context flag); the marker is still placed. Permalink address writes preserve the active feature selection, while explicit feature navigation and browser history traversal still apply.
