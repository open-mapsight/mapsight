# Accessibility

Mapsight treats accessibility as a **product goal** ([Principles](architecture/PRINCIPLES.md)), but the open-source
tree has **not** completed a formal WCAG audit.

---

## Status (October 2026)

| Area                                 | Status                                                                                                                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Formal WCAG 2.x conformance audit    | **Not completed**                                                                                                                                                                                                  |
| Keyboard use in map/list UI          | Partial — varies by component                                                                                                                                                                                      |
| Screen reader support for map canvas | **Limited** — OpenLayers canvas model                                                                                                                                                                              |
| Focus management in modals/overlays  | Partial — `focus-trap` / custom today; migrating toward **React Aria** ([Decision 007](architecture/decisions/007-ui-styling-strategy.md#primitive-preference-for-new--migrated-ui-chrome))                        |
| Colour contrast                      | Partial — host themes via CSS can help or harm; hard-coded package UI (e.g. count-aggregator-ui) must meet AA itself                                                                                               |
| Focus indicators                     | Partial — keyboard-reachable controls in `@mapsight/ui` base SCSS use `:focus-visible` rings; count-aggregator-ui controls should too                                                                              |
| Automated a11y checks                | Available: [`@mapsight/a11y-audit`](../packages/a11y-audit/README.md) (axe-core + keyboard, dialog, map, language, text-spacing, reflow checks); showcase config in `apps/showcase/a11y.config.mts`. Not yet in CI |

---

## Known gaps

- Map canvas content is not fully exposed as semantic HTML — expect gaps vs document-centric WCAG criteria.
- Host themes can improve or harm contrast; test it with your brand CSS. Hard-coded greys in package source are not “host-dependent” — they must pass AA on the shipped surface colour.
- Focus indicators belong in component/base styles (`:focus-visible`); blanking `outline` on keyboard-reachable controls without a visible replacement fails 2.4.7.
- i18n and locale strings are host/config responsibility
  until [Decision 008](architecture/decisions/008-i18n-approach.md)
  resolves.

### Open findings (October 2026)

From the [code review of `@mapsight/ui` and `@mapsight/core`](accessibility/2026-10-27-ui-core-code-review.md)
and an `@mapsight/a11y-audit` run on a production host (12 integrations, 344 embeds sampled) and on
the showcase. Highest impact first:

| Area                 | Problem                                                                                                           | WCAG         | Ref                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------ | -------------------- |
| Feature list         | Rows are `tabindex=-1`; link rows unreachable; ArrowDown throws on link-only lists; container has no role or name | 2.1.1, 4.1.2 | CR-UI-001            |
| Feature list         | `<li>` rendered inside a `div`; selected row exposes no state                                                     | 1.3.1, 4.1.2 | CR-UI-002            |
| Selection info       | After closing, focus stays in the collapsed panel and Tab walks invisible controls                                | 2.4.3, 2.4.7 | CR-UI-003            |
| Map overlay          | Region selector `ul` is focusable while 0 px high                                                                 | 2.4.7, 2.1.1 | audit                |
| Place actions        | Visually hidden permalink is an invisible tab stop                                                                | 2.4.7        | CR-UI-013            |
| List header, cycling | Sort `<select>` unnamed; list-options popover dialog unnamed; cycling dots unnamed                                | 4.1.2        | CR-UI-016            |
| Map                  | Focus target has no role, name or keyboard instructions                                                           | 4.1.2, 3.3.2 | CR-UI-014            |
| Tools                | Measure distance and share position need a pointer; context menu reuses a stale point                             | 2.1.1        | CR-UI-004, CR-UI-007 |
| Viewport buttons     | Mobile view toggle and overlay buttons below 24 × 24 px                                                           | 2.5.8        | audit                |
| Overlays             | Tool overlay and `BottomSheet` handle every Escape on the page                                                    | APG          | CR-UI-006, CR-UI-011 |
| Status messages      | No announcements for filter counts, page changes, measurements, geolocation, copy                                 | 4.1.3        | CR-UI-009            |
| Layer switcher       | Checked base-layer radio is `disabled`; no arrow keys                                                             | 4.1.2        | CR-UI-010            |
| i18n                 | react-paginate English labels ("Pagination", "Jump forward"); `en-GB` falls back to German; "Resize" default      | 3.1.2        | CR-UI-017            |

Run `node packages/a11y-audit/src/cli.ts run --config apps/showcase/a11y.config.mts --base-url http://localhost:4173`
against `pnpm --filter @mapsight/showcase start` to check fixes without a host.

---

## Heading hierarchy

Heading ranks can follow the host page through the opt-in `future.v8_automaticHeadings` resolver and permanent
`headings.baseLevel` configuration. Historical 7.x elements remain without the flag. See the
[heading integration guide](../packages/ui/docs/HEADINGS.md), including explicit list grouping, modal scopes,
non-modal regions, and full-page audit requirements.

## Roadmap

1. Public accessibility status
2. Inventory of UI components vs WCAG criteria
3. Prefer **custom → `react-aria` hooks → `react-aria-components` / shadcn Aria recipes** for new chrome and overlay work ([Decision 007](architecture/decisions/007-ui-styling-strategy.md#primitive-preference-for-new--migrated-ui-chrome))
4. Playwright + axe (or equivalent) in CI for embed smoke paths — the tooling exists (`@mapsight/a11y-audit`, showcase config); CI wiring with a baseline is next
5. Published conformance target once audit completes

Reusable overlay shells (`NativeDialog`, `PopoverDialog`, `BottomSheet`) are tracked
in [`packages/ui/docs/A11Y_OVERLAY_PRIMITIVES.md`](../packages/ui/docs/A11Y_OVERLAY_PRIMITIVES.md).

Report issues: [GitHub issues](https://github.com/open-mapsight/mapsight/issues) with label `accessibility` if
available.

---

## Related

- [Principles](architecture/PRINCIPLES.md)
- [Decision 007 — UI styling](architecture/decisions/007-ui-styling-strategy.md)
