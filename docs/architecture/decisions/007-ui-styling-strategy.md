# Decision 007: UI styling strategy — composable host-native presentation

**Status:** Documented goal; implementation path open

**Date:** 2026-06-13

**Updated:** 2026-07-19 — prefer React Aria over Radix for composition work; shadcn Aria as recipes

## Context

Geoportals ship a **fixed portal shell**. Mapsight’s USP is **host-native, composable** experiences: optional map/list
layouts, controls in map or list or page chrome, theming, and declarative JSON from
CMS ([Principles](../PRINCIPLES.md#composable-ui-vs-fixed-portal-shell)).

Two styling layers matter:

| Layer             | What it styles               | Today                                                 |
| ----------------- | ---------------------------- | ----------------------------------------------------- |
| **Map symbology** | Features, icons, layer rules | `styleFunction`, vector-style-compiler, traffic-style |
| **UI chrome**     | Lists, filters, popups       | BEM + SCSS theme partials, embed config               |

`@mapsight/ui` already uses **`react-aria`** hooks in places (`usePress`, `useId`, …). As of July 2026, shadcn/ui
offers React Aria Components as a first-class base (`--base aria`) alongside Base UI and Radix — so “follow shadcn”
no longer implies adopting Radix.

## Decision

**Goal (settled):**

- **Sane defaults** — usable without a design workshop
- **Host-native customization** — match surrounding site typography, colors, spacing
- **Declarative over fork** — config, theme files, composition hooks before per-customer forks

**Means (evolving — not mutually exclusive long term):**

| Approach                               | Description                                                                                                                                                                                                        | Status                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| **A — Declarative options + BEM/SCSS** | Theme variables, BEM blocks, host CSS alongside embed                                                                                                                                                              | **Current** production pattern; long-term may move to native CSS ([Decision 009](009-native-css-over-scss.md)) |
| **B — Composition + design tokens**    | Headless primitives + token-based theming; **React Aria** as the a11y stack; shadcn’s **Aria** registry as composition **recipes** (not a global Mapsight skin)                                                    | **Target direction** for new components; full `@mapsight/ui` migration **TBD**                                 |
| **C — Hybrid “support everything”**    | Hosts may combine **A + B**: SCSS theme partials and embed config **and** token overrides / composable primitives where needed; map symbology stays on styleFunction/compiler path independent of UI chrome choice | **Likely long-term reality** — document boundaries so teams do not fork unnecessarily                          |

### Primitive preference (for new / migrated UI chrome)

Prefer the lowest layer that fits:

1. **Custom** — map-native / host-themed chrome where BEM + tokens (or host CSS) are enough
2. **`react-aria` hooks** — thin controls that need press, focus, ids, or mergeProps without a compound tree
3. **`react-aria-components` (+ shadcn Aria recipes)** — Dialog, Select, Combobox, Menu, Tabs, and similar widgets
   where focus scopes and composition are the hard part

Stay on **one** headless family (React Aria). Do **not** start a parallel Radix or Base UI track in `@mapsight/ui`
just to mirror older shadcn defaults.

For a **published** library package, treat shadcn output as **copy-paste / adapt** into Mapsight-styled primitives —
not “install Tailwind shadcn into `@mapsight/ui`.” Closer shadcn + Tailwind usage remains appropriate in app-side or
domain packages that already use Tailwind (e.g. count-aggregator-ui).

Option **C** explicitly allows a municipal site on SCSS overrides while a domain package uses Tailwind tokens — same
`@mapsight/ui` components, different integration depth. A future **native CSS**
migration ([Decision 009](009-native-css-over-scss.md)) would shift Option A toward custom properties without changing
the composable goal.

Do **not** document “Mapsight uses shadcn globally” until a migration is real. Document React Aria / RAC adoption when
concrete components land.

## Consequences

### Positive

- Clear product contrast vs geoportal chrome and minimal Google embed styling
- Hosts can integrate with existing design systems at the level that fits
- Map symbology and UI chrome can evolve independently
- Hybrid avoids forcing one host type into the wrong styling model
- One a11y primitive stack aligned with existing `react-aria` usage and shadcn’s Aria base

### Negative / trade-offs

- Multiple styling systems in play (SCSS ui + Tailwind domain packages + host CSS)
- Documentation must explain **when to use which layer** — higher contributor cognitive load
- Token strategy should be updated here when `@mapsight/ui` migration scope is clearer
- Contributors must ignore Radix-default shadcn docs unless the project is on `--base aria`

## Alternatives considered

| Option                                                 | Why not                                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| **A or B only (exclusive)**                            | Too rigid — real hosts mix CMS SCSS with modern component libraries                              |
| **Radix- or Base UI–first (older shadcn default)**     | Extra headless stack; Aria already in `@mapsight/ui`; shadcn Aria covers the same recipe surface |
| **Single global Bootstrap theme (Masterportal-style)** | Conflicts with embed-first, per-site branding                                                    |
| **Inline styles only**                                 | Poor maintainability for municipal design systems                                                |
| **Host must fork `@mapsight/ui` for any branding**     | Violates declarative-over-fork principle                                                         |

## References

- [Principles → Composable UI](../PRINCIPLES.md#composable-ui-vs-fixed-portal-shell)
- [`packages/ui/src/scss/themes/`](../../../packages/ui/src/scss/themes/)
- [`packages/vector-style-compiler/docs/`](../../../packages/vector-style-compiler/docs/)
- [Decision 009 — Native CSS over SCSS](009-native-css-over-scss.md)
- [shadcn/ui — React Aria base (July 2026)](https://ui.shadcn.com/docs/changelog/2026-07-react-aria.md)
- [React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html)
