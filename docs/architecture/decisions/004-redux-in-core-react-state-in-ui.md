# ADR 004: Redux in core; modern React state in UI

**Status:** Accepted (direction); UI migration **in progress**

**Date:** 2026-06-13

## Context

Mapsight’s differentiator is a **declarative GIS runtime**: map, list, filters, and feature data as one replayable Redux tree, with OpenLayers as a projection ([`REDUX_ARCHITECTURE.md`](../../../packages/core/docs/REDUX_ARCHITECTURE.md)).

Over time, `@mapsight/ui` also used Redux for **local UI chrome** (panels, transient UI flags) and for **hand-rolled async fetch state** (feature detail HTML, JSON sidecars). That blurs boundaries and duplicates loading/error logic that belongs in a proper async layer.

## Decision

1. **`@mapsight/core` owns GIS Redux** — map, layers, view, feature sources, list/filter domain state, path actions (`set`, `merge`, `mergeAll`).
2. **`@mapsight/ui` moves toward React state** (Context, `useState`, component-local state) for **non-GIS UI chrome** over time.
3. **Async data in UI uses TanStack Query**, not Redux and **not RTK Query** — e.g. feature detail HTML, supplementary JSON, geolocation (async browser APIs with loading/error states, not necessarily HTTP). TanStack Query sits alongside Context/`useState` as the standard for **React-side async resources** (see [ADR 005](005-fetch-and-tanstack-query-over-axios.md)).
4. **Phased modernization** — RTK patterns and Zod validation in core; retire hand-rolled `fetch` + Redux request/success/failure cycles in `@mapsight/ui`.

React remains the view layer; Redux remains the **GIS document**, not the entire application store and not the UI async cache.

## Consequences

### Positive

- Clear contract: serialize/hydrate GIS state without serializing every button toggle or HTML fragment
- Easier testing of map behavior independent of UI refactors
- One React async story (TanStack Query) for HTTP and non-HTTP resources (geolocation, permissions)
- Aligns with “core is usable without React” goal

### Negative / trade-offs

- Transitional period with mixed patterns in `@mapsight/ui` until migration completes
- TanStack Query adds a dependency to embed hosts that use rich UI features — acceptable vs ad-hoc fetch reducers
- Contributors must read [ACTION_GUIDE.md](../../../packages/core/docs/ACTION_GUIDE.md) for GIS actions vs Query hooks for UI data

## Alternatives considered

| Option                                      | Why not                                                                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **All state in Redux forever**              | UI churn and fetch cycles pollute GIS snapshots and SSR payloads                                                                       |
| **RTK Query in `@mapsight/ui`**             | Couples UI data to Redux; overlaps awkwardly with GIS store — evaluate **RTK Query in core** for feature loaders instead (see ADR 005) |
| **Drop Redux for Zustand/Jotai everywhere** | Breaks declarative GIS runtime and existing CMS integration                                                                            |
| **React only, no global GIS store**         | Loses replay, hydration, and CMS `mergeAll` story                                                                                      |

## References

- [`packages/core/docs/REDUX_ARCHITECTURE.md`](../../../packages/core/docs/REDUX_ARCHITECTURE.md)
- [`packages/core/docs/ACTION_GUIDE.md`](../../../packages/core/docs/ACTION_GUIDE.md)
- [`packages/ui/src/js/store/actions.ts`](../../../packages/ui/src/js/store/actions.ts) — legacy hand-rolled fetch actions (to replace)
- [ADR 005](005-fetch-and-tanstack-query-over-axios.md)
- [Current vs target](../CURRENT_VS_TARGET.md#runtime-and-state)
