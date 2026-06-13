# ADR 010: Communicative embed-first audience scope

**Status:** Accepted

**Date:** 2026-06-13

## Context

Mapsight serves many host types — municipalities, Stadtmarketing, NGOs, commercial sites — not only German Kommunen. Stakeholders often ask whether Mapsight replaces geoportals, GeoServer, or Google Maps.

We need an explicit **product boundary** for architecture docs, integration guides, and ecosystem positioning ([GIS stack choices](../ecosystem/GIS_STACK_CHOICES.md)).

## Decision

Mapsight’s **primary product** is **communicative, embed-first** maps:

- Thematic map + list + filter UX for **residents, visitors, and campaign audiences**
- **CMS-native** and **host-native** delivery (fragments that match the surrounding site)
- **GeoJSON-first** declarative runtime in `@mapsight/core`

**Adjacent, optional, not core:**

- Full **geoportals** (Masterportal, CIVITAS geoportal slot, Lizmap, ArcGIS Portal)
- **GIS back-office** (QGIS Desktop, FME, GeoServer administration)

**Complement, not replace:**

- **GeoServer** and OGC layers — Mapsight **consumes** published WMS/WFS/GeoJSON
- **mapsight-pulp** — scheduled ETL to static GeoJSON
- Optional **data platform** — time-series / Count Aggregator backends

Mapsight is **not Kommune-only** — any integrator may use OSS packages; PMPC and data-trust arguments apply especially when **public money** or **municipal basemaps** are involved.

## Consequences

### Positive

- Clear non-goals in [Principles](PRINCIPLES.md) and integration docs
- Stakeholder matrix in GIS stack choices without over-promising geoportal parity
- CIVITAS/Masterportal work framed as **optional tiers**, not roadmap default

### Negative / trade-offs

- Hosts wanting one product for both citizen embed and pro geoportal still need two channels or a geoportal product
- “Mapsight vs Masterportal” comparisons require careful wording — different channels, not direct substitutes

## Alternatives considered

| Option                                | Why not default                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Mapsight as full geoportal**        | Different UX, config model, and module surface; duplicates Masterportal/CIVITAS investment |
| **Mapsight Kommune-only positioning** | Excludes valid Stadtmarketing, NGO, and commercial embed hosts                             |
| **No written scope**                  | Repeated confusion in sales and integration discussions                                    |

## References

- [GIS stack choices](../ecosystem/GIS_STACK_CHOICES.md)
- [Positioning](../ecosystem/POSITIONING.md)
- [Principles](PRINCIPLES.md)
- [Ecosystem](ECOSYSTEM.md)
