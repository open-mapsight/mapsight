# Count Aggregator — Improvement Plan

Step-by-step roadmap for `@mapsight/count-aggregator-api` and `@mapsight/count-aggregator-ui`.

**Scope:** Make both packages understandable to newcomers on GitHub, tighten client ergonomics, reduce duplication, and close the test gap on the UI side.

**Out of scope:** `private/docs/count-aggregator/` — treat as local scratch notes; do **not** commit or maintain them in public docs. All user-facing documentation lives in the package READMEs (and a root README table entry).

**Documentation policy:** Package READMEs must not reference customer-specific or private apps. Use placeholder hosts (`https://<tenant>.example.tld/...`) until a public Mapsight platform tenant exists. Runnable demos live in open-source apps only (see Phase 1b).

**Companion doc:** [UI execution checklist](../count-aggregator-ui/PLAN.md) — same phases, UI-focused tasks and acceptance criteria.

---

## How to use this plan

1. Work phases **in order** unless noted otherwise.
2. Check off tasks as they land; keep acceptance criteria honest.
3. One PR per phase is ideal (easier review); small phases may be combined.
4. Update this file when scope changes — it is the source of truth.

---

## Phase 1 — Discoverability & package documentation

**Goal:** A GitHub visitor can find the feature, understand what each package does, and copy working embed/client snippets without reading source first.

**Depends on:** nothing.

### Tasks

- [x] **1.1** Add both packages to the root [README.md](../../README.md) package table (name, one-line description, npm badge, link to package README).
- [x] **1.2** Write [README.md](./README.md) for `@mapsight/count-aggregator-api` (see [outline below](#readme-outline-count-aggregator-api)).
- [x] **1.3** Write [README.md](../count-aggregator-ui/README.md) for `@mapsight/count-aggregator-ui` (see [outline below](#readme-outline-count-aggregator-ui)).
- [x] **1.4** Cross-link the two package READMEs (no customer-specific app references).
- [x] **1.5** Note in the UI README that a runnable local demo is planned in [Phase 1b](#phase-1b--reference-demo-mock-api) (mock API until a public platform tenant exists).

### Acceptance criteria

- Root README lists `@mapsight/count-aggregator-api` and `@mapsight/count-aggregator-ui` with npm version badges.
- Each package README stands alone: purpose, install (workspace + npm), build, test, minimal usage, exports overview, placeholder live-API URL pattern.
- No references to `private/docs/count-aggregator/` or private customer apps in committed docs.
- A new contributor can copy the README code snippets without reading source first.

### Estimated effort

~0.5–1 day.

---

## Phase 1b — Reference demo (mock API)

**Goal:** A contributor can run the count-aggregator UI locally against mocked platform data in under 10 minutes — without a live Mapsight tenant.

**Depends on:** Phase 1 (READMEs describe the packages; demo section can be filled in here).

### Tasks

- [x] **1b.1** Add an open-source demo entry point in [`apps/showcase`](../../apps/showcase) — **not** a private customer app.
- [x] **1b.2** Mock count-aggregator HTTP responses (station types, station list, time-series values) — reuse fixtures from `@mapsight/count-aggregator-api` where possible.
- [x] **1b.3** Wire `CountAggregatorRoot` → `QueryClientProvider` → `CountAggregatorProvider` → `CountAggregatorWizard` with a stepped `bicycleCount` (or equivalent) config.
- [x] **1b.4** Add **“Run the demo locally”** to the UI README: install, dev command, URL path.
- [ ] **1b.5** (Optional) Mock platform-only endpoints (presets, events) if overview / preset UI needs them in the demo.

### Acceptance criteria

- Demo runs from documented commands with no `.env` secrets and no live tenant.
- UI README “Run the demo locally” section is complete.
- Demo code lives only in open-source `apps/` — no customer branding or private URLs in package sources.

### Estimated effort

~1 day.

---

## Phase 2 — Config & API surface cleanup

**Goal:** One obvious way to configure apps; fewer legacy entry points; less duplicated constants.

**Depends on:** Phase 1 (so deprecations are documented in README).

### Tasks — shared

- [ ] **2.1** Consolidate `DEFAULT_PUBLIC_API_BASE_URL` and `DEFAULT_SMART_CITY_API_BASE_URL` into a single exported constant (re-export alias if needed for compat).
- [ ] **2.2** Document the **canonical config path**: `createStationTypeAppsConfig` + dynamic `station-types` from the API. Mark `createPlatformConfig` and `TrafficDataWizard` / `SmartCityWizard` / `WheelCounterWizard` as **deprecated** in JSDoc + README migration note.
- [ ] **2.3** Fix `usePresets()` to accept `appId` (or derive from context) instead of hardcoding `"traffic-data"`.
- [ ] **2.4** Align `isFeatureEnabled` fallback logic with the deprecated `showEvents` / `endpoints.presets` fields — document removal timeline in UI README.

### Tasks — API package

- [ ] **2.5** Export shared datetime validation from one module (`LOCAL_DATE_TIME_PATTERN` / `assertLocalDateTimeFields` used by `parseLocalDateTime` tests).
- [ ] **2.6** Decide on **park-and-ride routes** in the OpenAPI contract: keep with explicit aliases, or strip from client spec. Document the decision in the API README either way.
- [ ] **2.7** Post-process [scripts/generate.ts](./scripts/generate.ts) to fix the broken alias `count-aggregator.public.` on `/park-and-ride/export` (or strip unrelated routes in `sync-openapi`).

### Acceptance criteria

- No behavior regressions in published package APIs (existing integrators keep working).
- README “Getting started” shows only the canonical config path; legacy path in a “Migration / deprecated” section.
- No duplicate base-URL constants with different names unless one is a documented alias.

### Estimated effort

~1 day.

---

## Phase 3 — Client ergonomics & DRY

**Goal:** Call sites are typed and readable; mappers do not re-parse already-validated JSON.

**Depends on:** Phase 2.7 (codegen alias fix).

### Tasks — API package

- [ ] **3.1** Add **typed endpoint helpers** (thin wrappers), e.g. `listStations(client, type)`, `getValues(client, request)`, `getLastValues(...)`, returning inferred Zod types — keep generated `endpoints` for advanced use.
- [ ] **3.2** Re-export helpers from [src/index.ts](./src/index.ts); document in README as the recommended API (bracket aliases = escape hatch).
- [ ] **3.3** Add unit tests for each helper (mock fetch, assert URL + return type).
- [ ] **3.4** Document in README: JSON client vs CSV URL builders (`buildCsvExportUrl` — never call CSV through `createCountAggregatorClient`).

### Tasks — UI package

- [ ] **3.5** Rewire [hooks.ts](../count-aggregator-ui/src/api/hooks.ts) and [fetch-metric-data.ts](../count-aggregator-ui/src/feature-details-metrics/lib/fetch-metric-data.ts) to use typed helpers — remove `as TimeSeriesResponse` casts.
- [ ] **3.6** Simplify [mappers.ts](../count-aggregator-ui/src/api/mappers.ts): trust client/helper output; parse once at the boundary (helper or hook, not both).
- [ ] **3.7** Extract shared **time series → chart points** mapping used by `mapTimeSeriesMap` and `fetchMetricTimeSeries` into one function (API package or UI `headless` export).

### Tasks — headless export

- [ ] **3.8** Export mappers / shared mapping from `@mapsight/count-aggregator-ui/headless` for custom UIs (document in UI README).

### Acceptance criteria

- No `as TimeSeriesResponse` (or similar) casts in UI production code.
- README quickstart uses typed helpers, not bracket notation.
- `pnpm test` green in both packages.

### Estimated effort

~1–1.5 days.

---

## Phase 4 — Testing & CI confidence

**Goal:** UI test coverage matches its risk; typecheck covers test files; optional integration smoke exists.

**Depends on:** Phase 3 (helpers stabilize hook tests).

### Tasks — API package

- [ ] **4.1** Add tests for any new typed helpers (Phase 3).
- [ ] **4.2** Tighten [tsconfig.test.json](./tsconfig.test.json): match `core` pattern — include only `src/**/*.test.ts`, exclude fixtures from typecheck graph if not needed (today it includes all `src/**/*.ts`).
- [ ] **4.3** (Optional) Scheduled CI job: `SMOKE_COUNT_AGGREGATOR_API=1 pnpm test:smoke` with repo secrets — document in API README, not required for merge.

### Tasks — UI package

- [ ] **4.4** Add [tsconfig.test.json](../count-aggregator-ui/tsconfig.test.json) (extend package tsconfig; include `src/**/*.test.ts(x)`; `types: ["node"]`).
- [ ] **4.5** Add `typecheck:test` script + `"typecheck": "run-s typecheck:lib typecheck:test"` (mirror API package).
- [ ] **4.6** **Hook tests** — `useAggregatedValues`, `useLastValues`, `useStations`: mock helpers/client; assert query keys, `enabled` in stepped mode, URL params.
- [ ] **4.7** **Mapper tests** — `mapStationList`, `mapTimeSeriesMap` (dates, empty map, MSP id keys).
- [ ] **4.8** **ResultStep tests** — validation messages, CSV href when valid/invalid, truncation warning copy when `showExport`.
- [ ] **4.9** **prepareChartValues tests** — 5k cap behavior per station count.
- [ ] **4.10** (Optional) **Playwright** smoke in the Phase 1b demo app: open wizard, select station, stepped “Weiter”, assert chart container visible.

### Acceptance criteria

- UI package: at least **20** meaningful unit tests (up from ~10), covering hooks + wizard result path.
- `pnpm typecheck` passes in both packages including test tsconfigs.
- Manual QA checklist (below) executed once against the mock demo (or a staging tenant when available) and results noted in UI README or PR description.

### Manual QA checklist (`bicycleCount` stepped wizard)

- [ ] Station list loads on hub + wizard routes.
- [ ] Stepped wizard: selection → Weiter → chart renders.
- [ ] Resolution change refetches / updates chart.
- [ ] CSV download returns semicolon-separated data.
- [ ] Overview page: preset charts + CSV links (when presets are mocked or enabled).
- [ ] Embed: host-page global `button`/`input` rules do not break wizard controls inside `.msp-count-aggregator`.

### Estimated effort

~1.5–2 days.

---

## Phase 5 — Polish & long-term notes

**Goal:** Close remaining nits; set expectations for i18n and platform-only features.

**Depends on:** Phases 1–4.

### Tasks

- [ ] **5.1** README **“Non-goals / future work”** sections: i18n (German strings inline today), platform presets/events (not in OpenAPI), platform base URL mirror, public SaaS tenant docs when available.
- [ ] **5.2** (Optional) Zod schemas for presets/events responses — replace hand-rolled asserts in [platform.ts](../count-aggregator-ui/src/config/platform.ts) when platform endpoints are specced.
- [ ] **5.3** (Optional) Visual regression: Storybook or Playwright screenshot with fake CMS wrapper (aggressive global `button`/`input` rules).
- [ ] **5.4** Remove deprecated exports in a **future major** (0.2.0+): `createPlatformConfig`, legacy wizard components — track in README changelog section.
- [ ] **5.5** Mark this PLAN.md phases complete or archive completed sections to `PLAN.md` → “Completed” appendix.

### Acceptance criteria

- No open “known smell” from the review without a documented decision or ticket.
- Deprecated APIs have JSDoc `@deprecated` + README migration path.

### Estimated effort

~0.5–1 day (optional items additional).

---

## README outline: count-aggregator-api

Deliverable for Phase 1.2. Suggested sections:

1. **Title + one paragraph** — typed client for the Mapsight count-aggregator HTTP API.
2. **Install** — workspace / npm package name.
3. **Quick start** — `createCountAggregatorClient` + typed helper (after Phase 3; stub with bracket call until then).
4. **Scripts** — `generate`, `build`, `test`, `test:smoke`, `sync-openapi` + `.env.example`.
5. **Exports** — client, schemas, URL builders, datetime helpers, types.
6. **OpenAPI** — `@mapsight/count-aggregator-api/openapi.json`, sync from live, wheel-counter stripped.
7. **CSV vs JSON** — use URL builders for CSV downloads.
8. **Live API links** — placeholder URL pattern (`https://<tenant>.example.tld/msp/public/count-aggregator`); note public tenant TBD.
9. **Architecture** — generated vs hand-written files; do not edit `src/generated/client.ts`.
10. **Related packages** — link to `@mapsight/count-aggregator-ui`.
11. **Improvement plan** — link to this file.

---

## README outline: count-aggregator-ui

Deliverable for Phase 1.3. Suggested sections:

1. **Title + one paragraph** — embeddable React wizard/charts for count-aggregator data.
2. **Peer dependencies** — `react`, `react-dom`, `@tanstack/react-query`, `react-select`, `@mapsight/ui`.
3. **Required CSS** — `import "@mapsight/count-aggregator-ui/styles.css"`.
4. **Minimal embed example** — `CountAggregatorRoot` → `QueryClientProvider` → `CountAggregatorProvider` → `CountAggregatorWizard`.
5. **Config** — `createStationTypeAppsConfig`, `features`, `uiVariant`, resolutions.
6. **Exports** — main vs `/headless` vs `/styles.css`.
7. **Embedding** — root wrapper, `msca:` prefix, portals; link to theming (`createTheme`).
8. **Run the demo locally** — Phase 1b; placeholder until mock demo lands.
9. **Smart-city metrics** — brief note on `mountSmartCityMetrics` / feature-details placeholders.
10. **Testing** — `pnpm test`, what is covered.
11. **Deprecated** — legacy platform config (after Phase 2).
12. **Related packages** — link to API package + this PLAN companion.

---

## Phase summary

| Phase | Focus                                      | Packages            | Blocker |
| ----- | ------------------------------------------ | ------------------- | ------- |
| 1     | READMEs + root discovery                   | both                | —       |
| 1b    | Mock demo app                              | both + open `apps/` | Phase 1 |
| 2     | Config deprecation, constants, codegen fix | both + API          | Phase 1 |
| 3     | Typed helpers, DRY mappers                 | both                | Phase 2 |
| 4     | Tests, typecheck:test, QA                  | both + demo app     | Phase 3 |
| 5     | Polish, optional hardening                 | both                | Phase 4 |

**Total estimate:** ~5.5–7 days of focused work (excluding optional Phase 5 items).

---

## Completed

_Move finished phases here with date and PR link when done._

<!-- Example:
### Phase 1 — 2026-06-12 — #1234
All tasks complete.
-->
