---
"@mapsight/ui": patch
---

Announce async loading, refreshing and empty states reliably: `AsyncStatusRegion` now keeps a persistent `role="status"` live region mounted across phases, errors are consistently exposed as assertive alerts, and `aria-busy` no longer wraps the live region. The share-link URL field also gets an accessible label.
