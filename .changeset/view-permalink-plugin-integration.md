---
"@mapsight/ui": patch
---

The share position link plugin no longer recentres or rezooms the map for a marker link when another plugin has fixed the initial view from the page address (new optional `initialViewFromAddress` context flag); the marker is still placed. The feature deep-link plugin now ignores a `history.replaceState` that only repeats the feature that is already selected, so address-only updates no longer reselect it or add a history entry.
