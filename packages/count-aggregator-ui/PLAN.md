# Count Aggregator UI — Execution Checklist

UI-focused tasks for `@mapsight/count-aggregator-ui`. Phases and ordering match the [master plan](../count-aggregator-api/PLAN.md).

**Documentation policy:** Do not commit or link to `private/docs/count-aggregator/`. Package [README.md](./README.md) (Phase 1) is the user-facing doc. Do not reference private customer apps in package docs — use placeholder hosts and the Phase 1b mock demo for runnable examples.

---

## Phase 1 — Discoverability & package documentation

| ID  | Task                                                     | Files                        | Done |
| --- | -------------------------------------------------------- | ---------------------------- | ---- |
| 1.1 | Root README table entry (with npm badge)                 | [README.md](../../README.md) | [x]  |
| 1.3 | Write UI package README (full outline in master plan)    | [README.md](./README.md)     | [x]  |
| 1.4 | Cross-link API README only                               | README.md                    | [x]  |
| 1.5 | Point to Phase 1b for runnable demo (no live tenant yet) | README.md                    | [x]  |

### README must include (minimum)

- Peer deps and why each is required.
- **CSS import is mandatory** — unprefixed host Tailwind is not enough.
- **`CountAggregatorRoot` is mandatory** for embed-safe portals and theming.
- Minimal working example (copy-paste) with static `createStationTypeAppsConfig` sample.
- Example `bicycleCount` config (stepped, export, resolution) — illustrative only, no customer URLs.
- `/headless` export — when to use it vs styled components.
- Link to [API PLAN](../count-aggregator-api/PLAN.md).

---

## Phase 1b — Reference demo (mock API)

| ID   | Task                                                    | Files                                              | Done |
| ---- | ------------------------------------------------------- | -------------------------------------------------- | ---- |
| 1b.1 | Open-source demo entry in showcase                      | `apps/showcase`                                    | [x]  |
| 1b.2 | Mock API handlers (station types, stations, values)     | `count-aggregator-mock/mock-api.ts` + API fixtures | [x]  |
| 1b.3 | Full wizard wiring (`CountAggregatorRoot` → wizard)     | `count-aggregator-demo-page.tsx`                   | [x]  |
| 1b.4 | **“Run the demo locally”** section in README            | README.md                                          | [x]  |
| 1b.5 | (Optional) Mock platform presets/events for overview UI | demo app                                           | [ ]  |

---

## Phase 2 — Config & legacy cleanup

| ID   | Task                                                                                                         | Files                                                                                       | Done |
| ---- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ---- |
| 2.1  | Single `DEFAULT_PUBLIC_API_BASE_URL`; alias smart-city constant if needed                                    | `src/config/station-types.ts`, `src/feature-details-metrics/lib/fetch-metric-data.ts`       | [ ]  |
| 2.2  | `@deprecated` on `createPlatformConfig`, `TrafficDataWizard`, `SmartCityWizard`, `WheelCounterWizard`        | `src/config/platform.ts`, `src/components/apps/count-aggregator-wizard.tsx`, `src/index.ts` | [ ]  |
| 2.2b | README migration: `createStationTypeAppsConfig` + `useStationTypes` pattern (inline example, no private app) | README.md                                                                                   | [ ]  |
| 2.3  | `usePresets(appId)` — remove hardcoded `"traffic-data"`                                                      | `src/api/hooks.ts`, `src/index.ts`, call sites                                              | [ ]  |
| 2.4  | Document `features.*` vs legacy `showEvents` / `endpoints.presets`                                           | README.md, JSDoc on `CountAggregatorAppConfig`                                              | [ ]  |

### Acceptance (UI)

- No behavior regressions in published package APIs.
- No new code should import legacy wizard wrappers; grep repo for usages before deprecating.

---

## Phase 3 — Client ergonomics & DRY

| ID   | Task                                           | Files                                                  | Done |
| ---- | ---------------------------------------------- | ------------------------------------------------------ | ---- |
| 3.5  | Hooks use API typed helpers                    | `src/api/hooks.ts`                                     | [ ]  |
| 3.5b | Feature-details metrics use helpers            | `src/feature-details-metrics/lib/fetch-metric-data.ts` | [ ]  |
| 3.6  | Mappers parse once                             | `src/api/mappers.ts`                                   | [ ]  |
| 3.7  | Shared `mapTimeSeriesToChartPoints` (name TBD) | `src/api/mappers.ts` or `src/lib/` + metrics           | [ ]  |
| 3.8  | Export mappers / chart prep from `/headless`   | `src/headless.ts`, README.md                           | [ ]  |

### Acceptance (UI)

- Zero `as TimeSeriesResponse` / `as StationOverviewResponse` in `src/` (except tests if needed).

---

## Phase 4 — Testing & QA

| ID   | Task                                                                                      | Files                                                   | Done |
| ---- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---- |
| 4.4  | Add `tsconfig.test.json` (pattern: [core/tsconfig.test.json](../core/tsconfig.test.json)) | `tsconfig.test.json`                                    | [ ]  |
| 4.5  | `typecheck:test` + update `typecheck` script                                              | `package.json`                                          | [ ]  |
| 4.6  | Hook tests with mocked API helpers                                                        | `src/api/hooks.test.tsx` (new)                          | [ ]  |
| 4.7  | Mapper tests                                                                              | `src/api/mappers.test.ts` (new)                         | [ ]  |
| 4.8  | ResultStep tests                                                                          | `src/components/wizard/result-step.test.tsx` (new)      | [ ]  |
| 4.9  | `prepareChartValues` tests                                                                | `src/components/charts/time-series-chart.test.ts` (new) | [ ]  |
| 4.10 | (Optional) Playwright smoke in Phase 1b demo app                                          | `apps/`                                                 | [ ]  |

### Suggested test tooling

- `@testing-library/react` + `@testing-library/react-hooks` or renderHook from RTL — align with other Mapsight packages if present.
- Wrap hook tests: `QueryClientProvider` + `CountAggregatorProvider` with minimal config fixture.
- Vitest + jsdom (already used for feature-details tests).

### Manual QA

Run through the checklist in the [master plan Phase 4](../count-aggregator-api/PLAN.md#phase-4--testing--ci-confidence) against the Phase 1b mock demo. Record pass/fail in the PR that closes Phase 4.

---

## Phase 5 — Polish

| ID  | Task                                                                    | Done |
| --- | ----------------------------------------------------------------------- | ---- |
| 5.1 | README “Future work”: i18n, platform presets/events, public tenant docs | [ ]  |
| 5.2 | (Optional) Zod for presets when OpenAPI exists                          | [ ]  |
| 5.3 | (Optional) Visual regression / fake CMS wrapper                         | [ ]  |
| 5.4 | Plan removal of deprecated exports for 0.2.0                            | [ ]  |

---

## Component / file map (reference)

Useful when writing tests and README examples.

```
src/
├── api/
│   ├── hooks.ts          ← TanStack Query + API client
│   └── mappers.ts        ← API → UI types
├── components/
│   ├── apps/count-aggregator-wizard.tsx
│   ├── wizard/             ← selection, result, stepped shell
│   ├── charts/             ← TimeSeriesChart, OverviewChartPanel
│   └── export/             ← CsvDownloadLink
├── config/
│   ├── station-types.ts    ← canonical app config factory
│   └── platform.ts         ← deprecated legacy config
├── context/
│   ├── count-aggregator-provider.tsx
│   └── count-aggregator-root.tsx   ← required embed wrapper
├── feature-details-metrics/      ← map popup metrics (partial content)
├── headless.ts             ← hooks + data prep, no CSS
├── index.ts                ← public API
└── styles.css              ← built to dist/styles.css
```

---

## Completed

| Phase | Date | PR  |
| ----- | ---- | --- |
| —     | —    | —   |
