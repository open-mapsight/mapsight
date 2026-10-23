---
"@mapsight/lib-ol": minor
---

Add `extrusionRoof`, `extrusionLitWalls` and `extrusionShadedWalls` geometry derivations that draw polygons, including courtyard walls, as pseudo-3D blocks. Heights come from the style group's `extrusion-height`; invalid or non-positive values keep a flat footprint. Derived geometry caching is bounded and supports GeometryCollection children.
