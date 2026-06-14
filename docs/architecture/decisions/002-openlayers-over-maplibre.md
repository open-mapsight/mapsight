# Decision 002: OpenLayers over MapLibre GL (and Leaflet)

**Status:** Accepted

**Date:** 2026-06-13 (documented; decision predates open-source release)

## Context

Mapsight needs a web map engine that supports **mixed raster and vector workflows**, OGC layers (WMS/WFS), GeoJSON-heavy feature state, and a **custom vector styling pipeline** (`@mapsight/vector-style-compiler`, traffic styles).

Evaluated against MapLibre GL JS (vector-tile first) and Leaflet (lightweight, plugin ecosystem).

## Decision

Standardize on **OpenLayers** as the map engine synced to Redux in `@mapsight/core`.

Use MapLibre/Leaflet only in experimental or host-specific code outside the core stack — not as the supported Mapsight runtime.

## Consequences

### Positive

- First-class WMS/WFS and mixed layer types common in German municipal GeoServer stacks
- Vector styling via StyleFunction + compiler fits declarative Redux feature state
- Mature interaction model (select, modify, draw) for communicative map tools

### Negative / trade-offs

- Larger bundle than Leaflet; vector-tile–only apps may feel heavier than MapLibre
- 3D/Cesium-style experiences are out of core scope (geoportals often cover this)

## Alternatives considered

| Option                         | Why not                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **MapLibre GL JS**             | Strong for MVT basemaps; weaker fit for WMS-heavy municipal stacks and existing StyleFunction pipeline |
| **Leaflet**                    | Simple embeds only; OGC and advanced vector styling pushed to plugins                                  |
| **Dual OL + MapLibre in core** | Two reconcilers against Redux; unsustainable                                                           |

## References

- [`packages/core/docs/REDUX_ARCHITECTURE.md`](../../../packages/core/docs/REDUX_ARCHITECTURE.md)
- [`packages/vector-style-compiler/docs/ARCHITECTURE_DEEP_DIVE.md`](../../../packages/vector-style-compiler/docs/ARCHITECTURE_DEEP_DIVE.md)
- [`packages/lib-ol`](../../../packages/lib-ol/)
