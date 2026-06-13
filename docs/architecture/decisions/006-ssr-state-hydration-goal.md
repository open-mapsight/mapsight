# ADR 006: SSR and hydration for embed hosts

**Status:** Proposed (proven CMS pattern exists; **modern stack and runtime TBD**)

**Date:** 2026-06-13

## Context

Communicative maps on CMS pages benefit from **first meaningful paint** with list/map HTML, then client interactivity without losing GIS state.

**What exists in the monorepo:**

- `browserEmbed` reads `data-dehydrated-state` from the container ([`packages/ui/src/js/embed/browser.ts`](../../../packages/ui/src/js/embed/browser.ts))
- Node render entry points ([`packages/ui/src/js/server-handler.js`](../../../packages/ui/src/js/server-handler.js), [`packages/ui/src/js/embed/node.ts`](../../../packages/ui/src/js/embed/node.ts))

**What worked in production (reference deployment):**

A **PHP CMS controller** pattern:

1. POST embed options (preset, state, request URI) to a **small Node SSR service** (short timeout, size cap).
2. On success — inject returned **HTML shell** + **`reHydratedState`** into the page; client preset bootstraps on `DOMContentLoaded`.
3. On failure or timeout — **graceful fallback**: same embed markup and client-only bootstrap with inline JSON options (SSR inactive comment in HTML). Page still works; no hard dependency on SSR uptime.

This pattern predates current framework conventions and **should not be “Accepted” as the final architecture** until we evaluate modern alternatives.

**Also evolving:** Next.js, React Router (framework mode), TanStack Start, and similar **full-stack React** models offer different hydration stories than POST-to-Node-microservice.

**Open:** server runtime (**Node vs Bun**), whether SSR stays a sidecar service vs framework-integrated, and how Infosite/TYPO3 hosts wire it when CMS integration packages open-source.

## Decision

### Direction (not final)

1. **Hydration contract stays** — server emits HTML + serializable GIS state; client `browserEmbed` rehydrates ([Principles](../PRINCIPLES.md)).
2. **Graceful degradation is required** — CMS pages must work when the SSR service is down (proven in reference PHP controller).
3. **Evaluate modern host patterns** before locking implementation:
    - Legacy: PHP → POST → Node/Bun sidecar (reference deployment)
    - Framework: Next.js / React Router / TanStack Start SSR routes
    - SPA-only: client embed only (acceptable for some hosts)
4. **Do not require SSR** for all integrations; document paths in `integration/SSR_HYDRATION.md` once chosen.

### Not decided yet

- Primary server runtime (Node LTS vs Bun)
- Single sidecar vs per-framework adapters
- Uniform API across CMS PHP and Next hosts

## Consequences

### Positive

- Reference pattern already validated with fallback
- Monorepo hooks (`data-dehydrated-state`, node embed) remain useful regardless of host framework
- MPA transitions still use declarative JSON + `mergeAll` / `resetMapsightCore`

### Negative / trade-offs

- Two eras of docs until modern path is chosen — avoid over-documenting the sidecar as the only way
- Framework SSR may duplicate sidecar logic unless unified render API is extracted
- Dehydrated payloads must stay size-bounded — large GeoJSON may lazy-load after shell hydrate

## Alternatives considered

| Option                             | Notes                                                    |
| ---------------------------------- | -------------------------------------------------------- |
| **PHP → Node sidecar (reference)** | Works today with fallback; ops overhead (second process) |
| **Next.js / TanStack Start SSR**   | Modern DX; may not fit all CMS hosts                     |
| **React Router SSR**               | Middle ground for SPA-first municipal sites              |
| **Client-only embed always**       | Simplest ops; slower first paint                         |
| **iframe-only isolation**          | Breaks host-native UX and MPA transition story           |

## References

- [`packages/ui/src/js/embed/browser.ts`](../../../packages/ui/src/js/embed/browser.ts)
- [`packages/ui/src/js/server-handler.js`](../../../packages/ui/src/js/server-handler.js)
- [`starters/mapsight-next-starter`](../../../starters/mapsight-next-starter) — Next host copy-out template (evaluate, not mandate)
- Planned: [integration/SSR_HYDRATION.md](../../integration/SSR_HYDRATION.md)
