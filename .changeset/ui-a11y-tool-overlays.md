---
"@mapsight/ui": patch
---

Add keyboard and ARIA support to the measure-distance and share-position tool overlays: the overlay is a region labelled by its heading and closes on Escape, and the toggle buttons expose `aria-expanded` / `aria-controls` and get focus back when the overlay closes.
