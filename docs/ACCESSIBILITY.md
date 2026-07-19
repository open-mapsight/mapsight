# Accessibility

Mapsight treats accessibility as a **product goal** ([Principles](architecture/PRINCIPLES.md)), but the open-source
tree has **not** completed a formal WCAG audit.

---

## Status (July 2026)

| Area                                 | Status                                                                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formal WCAG 2.x conformance audit    | **Not completed**                                                                                                                                                                           |
| Keyboard use in map/list UI          | Partial — varies by component                                                                                                                                                               |
| Screen reader support for map canvas | **Limited** — OpenLayers canvas model                                                                                                                                                       |
| Focus management in modals/overlays  | Partial — `focus-trap` / custom today; migrating toward **React Aria** ([Decision 007](architecture/decisions/007-ui-styling-strategy.md#primitive-preference-for-new--migrated-ui-chrome)) |
| Colour contrast                      | **Host-dependent** — theming via CSS                                                                                                                                                        |
| Automated a11y tests in CI           | Planned (Playwright a11y checks)                                                                                                                                                            |

---

## Known gaps

- Map canvas content is not fully exposed as semantic HTML — expect gaps vs document-centric WCAG criteria.
- Host themes can improve or harm contrast; test it with your brand CSS.
- i18n and locale strings are host/config responsibility
  until [Decision 008](architecture/decisions/008-i18n-approach.md)
  resolves.

---

## Roadmap

1. Public accessibility status
2. Inventory of UI components vs WCAG criteria
3. Prefer **custom → `react-aria` hooks → `react-aria-components` / shadcn Aria recipes** for new chrome and overlay work ([Decision 007](architecture/decisions/007-ui-styling-strategy.md#primitive-preference-for-new--migrated-ui-chrome))
4. Playwright + axe (or equivalent) in CI for embed smoke paths
5. Published conformance target once audit completes

Report issues: [GitHub issues](https://github.com/open-mapsight/mapsight/issues) with label `accessibility` if
available.

---

## Related

- [Principles](architecture/PRINCIPLES.md)
- [Decision 007 — UI styling](architecture/decisions/007-ui-styling-strategy.md)
