# Architecture decision notes

Lightweight notes for technical and product decisions — framework choices, public API shapes, explicit non-goals, and ecosystem alignment.

This is not a formal governance process yet. The goal is to write down the reasoning we have today so future PRs have context.

Routine bug fixes, dependency bumps, and internal refactors without an external contract do not need a decision note.

---

## Index

| ID                                                | Title                                            | State                                    |
| ------------------------------------------------- | ------------------------------------------------ | ---------------------------------------- |
| [001](001-react-over-vue.md)                      | React over Vue                                   | Documented                               |
| [002](002-openlayers-over-maplibre.md)            | OpenLayers over MapLibre GL                      | Documented                               |
| [003](003-geojson-first-data-model.md)            | GeoJSON-first data model                         | Documented                               |
| [004](004-redux-in-core-react-state-in-ui.md)     | Redux in core; React state in UI                 | Documented; UI migration in progress     |
| [005](005-fetch-and-tanstack-query-over-axios.md) | Async data — fetch, loaders, query libraries     | Open notes; RTK Query for core TBD       |
| [006](006-ssr-state-hydration-goal.md)            | SSR and hydration for embed hosts                | Open notes; runtime / framework TBD      |
| [007](007-ui-styling-strategy.md)                 | UI styling — composable host-native presentation | Open notes; implementation path evolving |
| [008](008-i18n-approach.md)                       | Internationalization approach                    | Open notes; library TBD                  |
| [009](009-native-css-over-scss.md)                | Native CSS over Sass/SCSS                        | Open notes; feasibility TBD              |
| [010](010-audience-scope.md)                      | Communicative embed-first audience scope         | Documented                               |

---

## When to write a decision note

- Choosing a framework, protocol, or deployment pattern that is hard to reverse
- Explicit **non-goals** (e.g. not building a geoportal)
- Public API or config shape that external hosts depend on
- Licensing or ecosystem alignment (CIVITAS, PMPC)

---

## Format

Use [template.md](template.md) as a starting point when it helps. One file per topic is usually enough: `NNN-short-title.md`.

Keep the status plain: `Documented`, `Open`, `Deprecated`, or whatever short phrase best describes reality.

When a decision changes, update the existing note in a normal PR. Add a new follow-up note only when the history itself is useful to preserve.

---

## Related

- [Principles](../PRINCIPLES.md)
- [Current vs target](../CURRENT_VS_TARGET.md)
