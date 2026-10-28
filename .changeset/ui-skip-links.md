---
"@mapsight/ui": minor
---

Add opt-in skip links: with `uiState.skipLinks: true` the instance starts with “Skip to the map / list / search” links, each only when its target is present and visible, shown only on keyboard focus. They render after hydration, so server markup is unchanged. Default `false`; planned to default to `true` in v8.
