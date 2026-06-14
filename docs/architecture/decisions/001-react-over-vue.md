# Decision 001: React over Vue

**Status:** Accepted

**Date:** 2026-06-13 (documented; decision predates open-source release)

## Context

Mapsight targets **CMS embeds**, small SPAs, and React-friendly host stacks (Infosite/TYPO3 pages, custom municipal sites, Next.js demos). The German municipal GIS ecosystem also includes **Vue-based geoportals** (notably Masterportal), which serve a different product channel — pro-user portals, not communicative embeds.

We needed a UI library that:

- Matches how most new communicative map frontends in our deployments were already built
- Shares tooling with `@mapsight/ui`, showcase, and domain packages
- Keeps a clear boundary: Mapsight is **not** a Masterportal fork

## Decision

Use **React** as the primary UI framework for `@mapsight/ui` and reference applications.

Mapsight does **not** ship a Vue adapter. Geoportals may continue to use Vue (Masterportal, etc.) alongside Mapsight embeds on the same host.

## Consequences

### Positive

- One component model across core packages, demos, and count-aggregator UI
- Aligns with CMS integration patterns that mount React roots in page fragments
- Easier hiring and contributor onboarding in the React/OpenLayers niche

### Negative / trade-offs

- No drop-in Mapsight UI for Vue hosts — they integrate via script embed or iframe, not Vue components
- Ecosystem docs must explain **coexistence** with Vue geoportals, not competition

## Alternatives considered

| Option                                     | Why not                                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------- |
| **Vue (Masterportal-aligned)**             | Optimizes for geoportal product shape; our primary scope is communicative embeds    |
| **Framework-agnostic Web Components only** | Higher integration cost; deferred (see non-goals in [Principles](../PRINCIPLES.md)) |
| **Dual React + Vue UI packages**           | Maintenance burden; two design systems for the same map runtime                     |

## References

- [Principles → Product scope](../PRINCIPLES.md#product-scope)
- [Ecosystem](../ECOSYSTEM.md) — optional Masterportal on same deployment
- Planned: [POSITIONING.md](../../ecosystem/POSITIONING.md)
