---
"@mapsight/ui": patch
---

Improve accessibility of map overlay controls. Region buttons expose the selected region with `aria-pressed`. The visually hidden place-actions permalink leaves the Tab order. Geolocation progress and errors and copy results (link, coordinates, failures) are announced. The Mapsight logo no longer looks interactive (no pointer cursor or hover change). The mobile view toggle is 44×44 px and overlay buttons keep a 24 px minimum width. Attribution text keeps an opaque backing and explicit text colour when hosts supply a translucent background token.
