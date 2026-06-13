# Accessibility

Mapsight treats accessibility as a **product goal** ([Principles](../architecture/PRINCIPLES.md)), but the open-source
tree has **not** completed a formal WCAG audit. This page states the current status for procurement and integrators.

---

## Status (June 2026)

| Area                                 | Status                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Formal WCAG 2.x conformance audit    | **Not completed**                                                                                |
| Keyboard use in map/list UI          | Partial — varies by component                                                                    |
| Screen reader support for map canvas | **Limited** — OpenLayers canvas model                                                            |
| Focus management in modals/overlays  | Partial (e.g. focus-trap in some UI)                                                             |
| Colour contrast                      | **Host-dependent** — theming via CSS                                                             |
| Automated a11y tests in CI           | Planned (Playwright a11y checks — see [Current vs target](../architecture/CURRENT_VS_TARGET.md)) |

---

## Known gaps

- Map canvas content is not fully exposed as semantic HTML — expect gaps vs document-centric WCAG criteria.
- Host themes can improve or harm contrast; test it with your brand CSS.
- i18n and locale strings are host/config responsibility until [ADR 008](../architecture/decisions/008-i18n-approach.md)
  resolves.

---

## Roadmap

1. Public statement (this document)
2. Inventory of UI components vs WCAG criteria
3. Playwright + axe (or equivalent) in CI for embed smoke paths
4. Published conformance target once audit completes

Report issues: [GitHub issues](https://github.com/open-mapsight/mapsight/issues) with label `accessibility` if
available.

---

## Related

- [Principles](../architecture/PRINCIPLES.md)
- [UI styling ADR 007](../architecture/decisions/007-ui-styling-strategy.md)
