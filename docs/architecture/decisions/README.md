# Architecture decision records (ADRs)

Records of significant technical and product decisions — framework choices, public API shapes, explicit non-goals, and ecosystem alignment.

Routine bug fixes, dependency bumps, and internal refactors without an external contract do not need an ADR.

---

## Index

| ID                                                | Title                                            | Status                              |
| ------------------------------------------------- | ------------------------------------------------ | ----------------------------------- |
| [001](001-react-over-vue.md)                      | React over Vue                                   | Accepted                            |
| [002](002-openlayers-over-maplibre.md)            | OpenLayers over MapLibre GL                      | Accepted                            |
| [003](003-geojson-first-data-model.md)            | GeoJSON-first data model                         | Accepted                            |
| [004](004-redux-in-core-react-state-in-ui.md)     | Redux in core; React state in UI                 | Accepted (UI migration in progress) |
| [005](005-fetch-and-tanstack-query-over-axios.md) | Async data — fetch, loaders, query libraries     | Proposed (RTK Query for core TBD)   |
| [006](006-ssr-state-hydration-goal.md)            | SSR and hydration for embed hosts                | Proposed (runtime / framework TBD)  |
| [007](007-ui-styling-strategy.md)                 | UI styling — composable host-native presentation | Proposed (means TBD)                |
| [008](008-i18n-approach.md)                       | Internationalization approach                    | Proposed (library TBD)              |
| [009](009-native-css-over-scss.md)                | Native CSS over Sass/SCSS                        | Proposed (feasibility TBD)          |
| [010](010-audience-scope.md)                      | Communicative embed-first audience scope         | Accepted                            |

---

## When to write an ADR

- Choosing a framework, protocol, or deployment pattern that is hard to reverse
- Explicit **non-goals** (e.g. not building a geoportal)
- Public API or config shape that external hosts depend on
- Licensing or ecosystem alignment (CIVITAS, PMPC)

---

## Format

Use [template.md](template.md). One file per decision: `NNN-short-title.md`.

**Status values:** Proposed · Accepted · Deprecated · Superseded by ADR-xxx

When a decision changes, add a new ADR or mark the old one **Superseded** — do not rewrite history in place.

---

## Related

- [Principles](../PRINCIPLES.md)
- [Current vs target](../CURRENT_VS_TARGET.md)
