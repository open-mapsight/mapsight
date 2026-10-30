# Accessibility

Mapsight treats accessibility as a **product goal** ([Principles](architecture/PRINCIPLES.md)), but the open-source
tree has **not** completed a formal WCAG audit.

---

## Status (October 2026)

| Area                                 | Status                                                                                                                                                                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formal WCAG 2.x conformance audit    | **Not completed**                                                                                                                                                                                                                                 |
| Keyboard use in map/list UI          | Partial — varies by component                                                                                                                                                                                                                     |
| Screen reader support for map canvas | **Limited** — OpenLayers canvas model                                                                                                                                                                                                             |
| Focus management in modals/overlays  | Implemented restoration/inert handling; **React Aria** FocusScope for details/sheets; host journeys still need acceptance. See [Decision 007](architecture/decisions/007-ui-styling-strategy.md#primitive-preference-for-new--migrated-ui-chrome) |
| Colour contrast                      | Partial — host themes via CSS can help or harm; hard-coded package UI (e.g. count-aggregator-ui) must meet AA itself                                                                                                                              |
| Focus indicators                     | Partial — keyboard-reachable controls in `@mapsight/ui` base SCSS use `:focus-visible` rings; station selection also has a keyboard focus ring; host acceptance remains                                                                           |
| Automated a11y checks                | Available: [`@mapsight/a11y-audit`](../packages/a11y-audit/README.md) (axe-core + keyboard, dialog, map, language, text-spacing, reflow checks); showcase CI uses a committed baseline and rejects new serious failures or execution errors       |

---

## Known gaps

- Map canvas content is not fully exposed as semantic HTML — expect gaps vs document-centric WCAG criteria.
- Host themes can improve or harm contrast; test it with your brand CSS. Hard-coded greys in package source are not “host-dependent” — they must pass AA on the shipped surface colour.
- Focus indicators belong in component/base styles (`:focus-visible`); blanking `outline` on keyboard-reachable controls without a visible replacement fails 2.4.7.
- i18n and locale strings are host/config responsibility
  until [Decision 008](architecture/decisions/008-i18n-approach.md)
  resolves.

### Implemented fixes and remaining acceptance (28 October 2026)

The [27 October code review](accessibility/2026-10-27-ui-core-code-review.md) is a historical snapshot.
The following package fixes shipped in `@mapsight/ui` 7.8.0 through #373–#375, #377, #380–#382 and #390:

- Keyboard navigation across list rows and links; semantic lists and selection state.
- Inert collapsed details, focus restoration, named sort/options controls and cycling status.
- Named map surface with keyboard instructions, focus indicators and larger overlay targets.
- Scoped Escape handling, translated pagination and resize labels, locale normalisation,
  announcements, native base-layer radios, and configurable heading hierarchy.
- Keyboard measurement and position sharing via the **opt-in** `keyboardDrawing` option.

Follow-up fixes on main (#400/#401) correct control naming/contrast and list disclosure state.
The current tree also supports `FeatureSelectionInfo landmark={false}` inside an already named
sheet, removes nested banner semantics and empty page headings, and labels station/date inputs.
These changes still require a package release and host adoption. Do not treat the historical
review's complete list as current unresolved defects, or merged code as completed host acceptance.

Real open work:

- Core map `animate`/`fit` and some smooth scrolling still need reduced-motion handling
  (CR-CORE-001; WCAG 2.3.3 is AAA). Point-input forms need a keyboard selection/confirmation path.
- Raw feature-description HTML (including heading levels and duplicate contact IDs) belongs to
  the feed/host. Package heading options do not rewrite embedded HTML.
- CMS lazysizes/sitekit enhancements must coordinate with hydration before mutating embed HTML.
  Shared project/settings/i18n state still requires the host SSR render queue; request-local
  state is required before removing the queue. That concurrency work remains a separate follow-up.
- Screen-reader journeys, zoom/reflow with real host chrome, contrast over map tiles, touch
  targets and focus visibility under floating CMS controls still require manual acceptance.
- Production rollout and a production audit after package/host adoption are **not verified**.
  A successful local SSR harness or test-system audit does not establish production acceptance.

See the [showcase audit baseline and rerun instructions](../apps/showcase/A11Y.md) for current
remaining automated findings and the CI gate. Manual checks remain untested unless a named
tester records their results; automation does not establish WCAG conformance.

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
4. Maintain the showcase CI baseline and extend host-specific automated/manual coverage
5. Published conformance target once audit completes

Reusable overlay shells (`NativeDialog`, `PopoverDialog`, `BottomSheet`) are tracked
in [`packages/ui/docs/A11Y_OVERLAY_PRIMITIVES.md`](../packages/ui/docs/A11Y_OVERLAY_PRIMITIVES.md).

Report issues: [GitHub issues](https://github.com/open-mapsight/mapsight/issues) with label `accessibility` if
available.

---

## Related

- [Principles](architecture/PRINCIPLES.md)
- [Decision 007 — UI styling](architecture/decisions/007-ui-styling-strategy.md)
