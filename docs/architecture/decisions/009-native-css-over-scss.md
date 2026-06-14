# Decision 009: Native CSS over Sass/SCSS

**Status:** Proposed (**feasibility not validated**)

**Date:** 2026-06-13

## Context

Mapsight uses **Sass/SCSS** in several places, but not everywhere for the same reasons:

| Area                                  | SCSS role                                                                                                                                                                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`@mapsight/traffic-style`**         | **Heaviest use** — mixins, functions, icon sprite SCSS output, feature symbology sources compiled via vector-style-compiler CLI                                                                                                                                                      |
| **`@mapsight/ui`**                    | BEM blocks, theme partials (`$ms3-themeColorA`, …), `breakpoint-sass`                                                                                                                                                                                                                |
| **`@mapsight/vector-style-compiler`** | **Not an SCSS engine** — compiles a **CSS subset** into OpenLayers style functions. The CLI optionally runs **Sass as a pre-step** when the input file is `.scss`/`.sass`, then passes plain CSS to the compiler ([`cli.ts`](../../../packages/vector-style-compiler/src/js/cli.ts)) |
| **Apps / embed builds**               | Vector-style entry `.scss` files (often wrapping traffic-style) and UI theme imports                                                                                                                                                                                                 |

Modern browsers and build tools support **native CSS** with nesting, custom properties (`--*`), `@layer`, and container queries. Dropping Sass would:

- Remove `sass`, `breakpoint-sass`, and SCSS compilation from the toolchain
- Simplify contributor mental model (one styling language)
- Align with [Decision 007](007-ui-styling-strategy.md) Option B/C — custom properties transfer to hosts more naturally than Sass variables

**Main risk:** `@mapsight/traffic-style` mixins and functions (`str-replace`, icon dimension helpers, env-image paths) may need **build-time generation or JS** rather than a straight CSS port. **`@mapsight/ui`** is largely mechanical (variables → custom properties, nested `@media`). **vector-style-compiler** itself should be low-risk once sources are `.css` — drop the CLI Sass pre-step and optional `sass` dependency.

## Decision

**Direction (aspirational, not scheduled):**

Migrate from Sass/SCSS to **native CSS** (with nesting and custom properties) across the monorepo **where feasible**, phased by package.

**Not decided — requires feasibility spikes:**

| Question                             | Notes                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **`traffic-style` mixins/functions** | Largest effort — rewrite as native CSS, generated CSS, or build scripts? Icon sprite SCSS output too.                           |
| **`@mapsight/ui` theme + blocks**    | Sass `$variables` → `:root` / `[data-theme]` custom properties; replace `breakpoint-sass` with nested `@media` or custom media. |
| **vector-style-compiler CLI**        | Once sources are `.css`, remove Sass pre-compile and `sass` peer/dev dependency — **compiler core unchanged**.                  |
| **App / embed entry files**          | Point `vector-style-compiler` at `.css` instead of `.scss` after traffic-style migration.                                       |
| **Build pipeline**                   | Vite/Lightning CSS handle modern CSS; confirm no regressions for embed consumers loading compiled CSS.                          |
| **Host integrators**                 | Document migration for hosts that `@import` SCSS theme files today.                                                             |

**Until spikes complete:** SCSS remains **current truth**. Start feasibility with **traffic-style**, not vector-style-compiler internals.

## Consequences

### Positive

- Fewer dependencies and faster installs
- Host theming via standard CSS variables
- vector-style-compiler already speaks CSS — symbology pipeline stays stable

### Negative / trade-offs

- **traffic-style** rewrite may be non-trivial (logic currently in Sass functions)
- Large diff surface in `@mapsight/ui` (many partials, mostly mechanical)
- Customer repos with custom `.scss` vector-style entry files need a documented migration path

## Alternatives considered

| Option                              | Notes                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| **Keep SCSS indefinitely**          | Works today; extra toolchain forever                                            |
| **CSS-in-JS / Tailwind only**       | Does not replace traffic-style symbology or ui BEM chrome alone                 |
| **Partial migration — ui first**    | Possible interim; traffic-style remains on Sass until symbology spike completes |
| **PostCSS plugins instead of Sass** | Middle ground in ui; unlikely to replace traffic-style function mixins          |

## References

- [Decision 007 — UI styling strategy](007-ui-styling-strategy.md)
- [`packages/traffic-style/src/scss/`](../../../packages/traffic-style/src/scss/)
- [`packages/ui/src/scss/`](../../../packages/ui/src/scss/)
- [`packages/vector-style-compiler/README.md`](../../../packages/vector-style-compiler/README.md) — CSS-in, JavaScript styleFunction out
- [`packages/vector-style-compiler/src/js/cli.ts`](../../../packages/vector-style-compiler/src/js/cli.ts) — optional Sass pre-step only
- [Current vs target](../CURRENT_VS_TARGET.md)
