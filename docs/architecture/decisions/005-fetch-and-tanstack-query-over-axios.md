# ADR 005: Async data — fetch, loaders, and query libraries

**Status:** Proposed (direction: no axios; **loader/query strategy TBD**)

**Date:** 2026-06-13

## Context

Mapsight loads GeoJSON, feature detail HTML, count-aggregator APIs, and remote config. **Today the reality is uneven:**

| Layer                                | Today                                                                                       | Problem                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **`@mapsight/core` feature loaders** | Hand-rolled loader modules (`xhr-json-loader`, `combined-loader`, …) dispatching into Redux | No shared cache, deduplication, or stale-while-revalidate; loading/error logic duplicated per loader |
| **`@mapsight/ui`**                   | Hand-rolled `fetch` + Redux request/success/failure actions (e.g. feature detail HTML)      | Same issues; blurs UI async with GIS Redux ([ADR 004](004-redux-in-core-react-state-in-ui.md))       |
| **Domain React apps**                | TanStack Query in count-aggregator-ui, showcase                                             | Good pattern, not yet adopted in core/ui embed path                                                  |

Some adjacent ecosystems (e.g. CIVITAS Portal Frontend) use **axios** — Mapsight does not need to match that for communicative embeds.

**Best long-term option is not fully decided.** This ADR records agreed constraints and open choices.

## Decision

### Agreed now

1. **Do not add axios** as a Mapsight workspace dependency unless a hard interoperability requirement appears.
2. **HTTP transport** uses the platform **`fetch` API** (already in core `xhr-json-loader` and ui actions).
3. **`@mapsight/ui` async resources** → **TanStack Query** (`@tanstack/react-query`), including:
    - HTTP: feature detail HTML, supplementary JSON
    - **Non-HTTP:** geolocation, permissions, and other async browser APIs that need loading/error/cache semantics
4. **TanStack Query is not the Redux GIS store** — it complements React state in UI; it does not replace path actions or feature-source state in core.

### Open — needs spike / ADR update

| Question                        | Options                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Core feature-source loading** | Keep/evolve hand-rolled loaders · **RTK Query** attached to the Redux store · hybrid (RTK Query for remote sources, local loaders for in-memory) |
| **Migration order**             | Core loaders first vs ui fetch actions first                                                                                                     |

**Working hypothesis:** RTK Query (or RTK async patterns) may fit **core** because feature loads tie directly to Redux feature-source state. **TanStack Query** fits **React UI** because detail HTML and geolocation are view concerns. Validate with a small prototype before marking Accepted.

## Consequences

### Positive

- Honest about current technical debt
- Clear split emerging: GIS state in Redux; UI async in TanStack Query
- Avoids axios supply-chain weight

### Negative / trade-offs

- Two query libraries possible (RTK Query + TanStack Query) if core adopts RTK Query — must document boundaries clearly
- Migration touches embed-critical loader paths — needs tests
- Until migration completes, contributors still encounter legacy hand-rolled fetch in core and ui

## Alternatives considered

| Option                                     | Why not (for now)                                      |
| ------------------------------------------ | ------------------------------------------------------ |
| **axios everywhere**                       | Extra dependency; duplicates fetch                     |
| **Status quo hand-rolled loaders**         | Known pain; no cache/dedup; hard to maintain           |
| **TanStack Query inside `@mapsight/core`** | Core is React-optional; Query is React-centric         |
| **RTK Query in `@mapsight/ui`**            | Wrong layer — see ADR 004                              |
| **SWR instead of TanStack Query**          | Less alignment with existing count-aggregator-ui usage |

## References

- [`packages/core/src/js/lib/feature-sources/loaders/`](../../../packages/core/src/js/lib/feature-sources/loaders/)
- [`packages/ui/src/js/store/actions.ts`](../../../packages/ui/src/js/store/actions.ts)
- [`packages/count-aggregator-ui`](../../../packages/count-aggregator-ui/)
- [ADR 004](004-redux-in-core-react-state-in-ui.md)
- [Principles → Technical principles](../PRINCIPLES.md#technical-principles)
