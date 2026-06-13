# ADR 007: UI styling strategy — composable host-native presentation

**Status:** Proposed (goal accepted; **implementation path open**)

**Date:** 2026-06-13

## Context

Geoportals ship a **fixed portal shell**. Mapsight’s USP is **host-native, composable** experiences: optional map/list layouts, controls in map or list or page chrome, theming, and declarative JSON from CMS ([Principles](../PRINCIPLES.md#composable-ui-vs-fixed-portal-shell)).

Two styling layers matter:

| Layer             | What it styles               | Today                                                 |
| ----------------- | ---------------------------- | ----------------------------------------------------- |
| **Map symbology** | Features, icons, layer rules | `styleFunction`, vector-style-compiler, traffic-style |
| **UI chrome**     | Lists, filters, popups       | BEM + SCSS theme partials, embed config               |

## Decision

**Goal (settled):**

- **Sane defaults** — usable without a design workshop
- **Host-native customization** — match surrounding site typography, colors, spacing
- **Declarative over fork** — config, theme files, composition hooks before per-customer forks

**Means (evolving — not mutually exclusive long term):**

| Approach                               | Description                                                                                                                                                                                                        | Status                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| **A — Declarative options + BEM/SCSS** | Theme variables, BEM blocks, host CSS alongside embed                                                                                                                                                              | **Current** production pattern; long-term may move to native CSS ([ADR 009](009-native-css-over-scss.md)) |
| **B — Composition + design tokens**    | Headless primitives, token-based theming; Radix/shadcn as **reference** for new work (e.g. count-aggregator-ui Tailwind)                                                                                           | **Target direction** for new components; full `@mapsight/ui` migration **TBD**                            |
| **C — Hybrid “support everything”**    | Hosts may combine **A + B**: SCSS theme partials and embed config **and** token overrides / composable primitives where needed; map symbology stays on styleFunction/compiler path independent of UI chrome choice | **Likely long-term reality** — document boundaries so teams do not fork unnecessarily                     |

Option **C** explicitly allows a municipal site on SCSS overrides while a domain package uses Tailwind tokens — same `@mapsight/ui` components, different integration depth. A future **native CSS** migration ([ADR 009](009-native-css-over-scss.md)) would shift Option A toward custom properties without changing the composable goal.

Do **not** document “Mapsight uses shadcn globally” until a migration is real. Track progress in [Current vs target](../CURRENT_VS_TARGET.md).

## Consequences

### Positive

- Clear product contrast vs geoportal chrome and minimal Google embed styling
- Hosts can integrate with existing design systems at the level that fits
- Map symbology and UI chrome can evolve independently
- Hybrid avoids forcing one host type into the wrong styling model

### Negative / trade-offs

- Multiple styling systems in play (SCSS ui + Tailwind domain packages + host CSS)
- Documentation must explain **when to use which layer** — higher contributor cognitive load
- Token strategy needs ADR update when `@mapsight/ui` migration scope is decided

## Alternatives considered

| Option                                                 | Why not                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| **A or B only (exclusive)**                            | Too rigid — real hosts mix CMS SCSS with modern component libraries |
| **Single global Bootstrap theme (Masterportal-style)** | Conflicts with embed-first, per-site branding                       |
| **Inline styles only**                                 | Poor maintainability for municipal design systems                   |
| **Host must fork `@mapsight/ui` for any branding**     | Violates declarative-over-fork principle                            |

## References

- [Principles → Composable UI](../PRINCIPLES.md#composable-ui-vs-fixed-portal-shell)
- [`packages/ui/src/scss/themes/`](../../../packages/ui/src/scss/themes/)
- [`packages/vector-style-compiler/docs/`](../../../packages/vector-style-compiler/docs/)
- [ADR 009 — Native CSS over SCSS](009-native-css-over-scss.md)
