---
"@mapsight/ui": patch
---

Make the map's keyboard focus ring actually visible. The inset outline on `.ms3-map-target` was painted underneath OpenLayers' positioned canvas layers, so focusing the map showed no indicator. The ring is now drawn on a pseudo-element above the map layers, with a white inner ring for contrast on any tiles; `--ms3-focus-ring-color` still sets its colour and forced-colors mode keeps the outline.
