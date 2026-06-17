# Decision 003: GeoJSON-first data model

**Status:** Accepted

**Date:** 2026-06-13 (documented; decision predates open-source release)

## Context

Mapsight’s Redux store describes **features, lists, filters, and selection** as serializable state. Hosts supply data
from CMS, [mapsight-pulp](https://github.com/open-mapsight/pulp), GeoServer, ArcGIS REST, and static files.

We needed a **primary in-memory model** for features that:

- Maps cleanly to list/map/filter UI
- Serializes for SSR hydration and CMS-driven `mergeAll` updates
- Works with OpenLayers vector layers without vendor lock-in

## Decision

Treat **GeoJSON FeatureCollections** (and Mapsight’s feature-source abstractions built on them) as the **primary feature
data model** in core state.

WMS/WFS, KML, and other formats are **supported as layers or inputs**, transformed at the boundary (loaders, pulp, host
APIs) — not as the canonical Redux document shape.

## Consequences

### Positive

- One feature shape for list rows, map symbology, and export
- Easy debugging — state is human-readable JSON
- Aligns with pulp output and CMS GeoJSON endpoints

### Negative / trade-offs

- Very large datasets may need tiling or server-side filtering — not solved by GeoJSON alone
- Raster-heavy workflows still need WMS paths parallel to vector features

## Alternatives considered

| Option                                      | Why not                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| **WMS/WFS as primary state**                | Not serializable feature lists; poor fit for declarative list/filter UX |
| **Proprietary vendor object model in core** | Lock-in; harder CMS and pulp integration                                |
| **Flat custom schema only**                 | Loses ecosystem tooling; GeoJSON is the interchange lingua franca       |

## References

- [Ecosystem → Data flow](../ECOSYSTEM.md#data-flow-summary)
- [`packages/core/src/js/lib/feature-sources/`](../../../packages/core/src/js/lib/feature-sources/)
- [mapsight-pulp](https://github.com/open-mapsight/pulp)
