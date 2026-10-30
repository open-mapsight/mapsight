# Feature-list selection subscriptions

Built-in standard and legacy HTML rows only need the global selection-presence
Boolean for `showSelectedOnly`. Previously every row subscribed to it, so
**none → A** and **A → none** updated every mounted row even with this option
disabled. Descendants then received fresh children and callbacks. This work is
separate from building selected-feature details.

Both row implementations now pass `observeGlobalSelection: false` to
`useFeatureListItemState`. The hook uses a stable constant selector when neither
this observation nor selected-only visibility is needed. It always calls
`useSelector`, including when options change. Per-feature select, highlight and
preselect subscriptions and the view subscription remain intact.

The hook is reachable through published deep imports. Its default remains
`observeGlobalSelection: true`, preserving its global `hasSelection` result for
existing callers. Opting out scopes that result to selected-only visibility;
callers opting out must use the derived `hidden` value for visibility. Neither
built-in row reads `hasSelection` directly. No host-side usage was found in the
fixture integration, and no public row props changed.

## Controlled local comparison, 2026-10-30

The same host snapshot, recorded source corpus (366 mounted rows), Mapsight
revision `5a105d173c9d762ae7ad8f466be04fc49e8e836d`, production build configuration,
and instrumentation were used on both sides. The candidate changes only the
hook and its two row call sites. Both builds contain the same feature-data
changes. These are new local builds, **not comparisons with earlier deployed
bundle versions**.

Three independent cold browser contexts per variant/profile, serial AB/BA/AB
order, no traces or concurrent builds/browser tests/analysis. Node 24.18.0,
perf-lab `4c7a8133ba10b1d1794118eef8cf8b2a7d7aff0b`, Playwright 1.64.1,
Chromium 156.0.8078.4. Desktop: 1400×900, DPR 1, CPU 1×. Simulated phone:
412×839, DPR 2.625, touch, CPU 4×. Not physical-device measurements.

Before each measured window, hit testing identifies the same non-cluster marker
without changing selection. The sequence is a real map tap from none to A,
a direct Redux selection action A → B, then real Escape clearing B. Each state
is checked. Escape here follows B, not the original A. Map resources are warmed
and frozen; both variants use identical data. All 12 measured reports have zero
captured page, hydration, HTTP, tile or truncation errors.

| Profile / window   | Component renders before → after | React work ms before → after, median [min–max] |
| ------------------ | -------------------------------: | ---------------------------------------------- |
| Desktop, select A  |                       2159 → 334 | 39.2 [39.1–39.6] → 23.6 [23.3–25.9]            |
| Desktop, A → B     |                        328 → 328 | 11.3 [10.9–13.0] → 11.2 [10.8–11.3]            |
| Desktop, Escape    |                       2070 → 245 | 19.5 [19.5–20.5] → 5.2 [5.1–5.3]               |
| Phone 4×, select A |                       2535 → 710 | 279.4 [266.0–304.5] → 210.2 [198.1–236.9]      |
| Phone 4×, A → B    |                        344 → 344 | 39.7 [39.2–47.1] → 42.3 [36.8–43.3]            |
| Phone 4×, Escape   |                        254 → 254 | 20.5 [18.0–20.8] → 20.5 [19.8–20.6]            |

Render counts are identical across all three repetitions in each cell. First
selection removes 1825 component renders (365 unrelated rows × five components)
on both profiles. Desktop clearing removes the same count. Separate untimed
commit walks counted actual row identities, without Top15 truncation: selecting
A updates 366 unique rows before and one after, on both profiles. Desktop A → B
updates two rows on both sides; clearing updates 366 before and one after.
Desktop selection also hovers A, so its one unique row executes twice in the
candidate. The phone has no mounted rows during switch/clear. A → B never changes
the global presence Boolean, so no improvement is expected from this fix.

React work is the union of observed scheduler-task intervals, not exclusive
component time, a continuous blocking interval or pointer-to-paint latency.
Counts are component renders, not unique DOM rows. Per-commit Top15 labels are
lower bounds; render-avoidance tests count actual executions rather than relying
on stable DOM nodes or memoized return values. Instrumentation adds overhead.
The sample size does not establish general end-user latency or statistical
significance.

The phone enters `mapOnly` and unmounts its list after selection. Remaining
renders include details, context/props propagation and responsive view work.
No general subscriber improvement is established: desktop select median is
32.6 → 32.5 ms; phone select is 230.5 [226.2–239.5] → 213.6 [201.7–269.4] ms.
These times overlap React work and must not be added to it. The combined-source
subscriber during hover is unchanged and requires its own investigation.

## Regression coverage

The hook and row tests cover actual render avoidance, none → A → B → none,
selected-only visibility and toggling it with an active selection, default deep
hook compatibility, inline details, highlight/preselect, responsive view changes,
standard and legacy HTML row activation, Enter/Space/click, focus retention,
selection scroll and scoped inline Escape restoring focus. Separate untimed
browser checks also confirm returning from mobile `mapOnly` to the 366-row list
with an empty selection, the same loaded data reference and the original SSR
root preserved on both sides.

Run from the repository root after installing and building workspace dependencies:

```sh
pnpm --filter @mapsight/ui exec vitest run src/js/components/feature-list-item
pnpm --filter @mapsight/ui test
pnpm --filter @mapsight/ui typecheck
pnpm check
```

The full UI suite passes (546 tests). The package currently excludes tests from
its normal typecheck; the two changed test files were also checked with the
production source files in a temporary no-emit project. Changed-file ESLint
passes with warnings. Local raw reports, immutable builds, corpus, scripts,
hashes and failed/excluded pilot logs are retained outside the tracked diff.
No deployment is needed. The previously observed mobile theme-map Escape issue
is separate and is not claimed as fixed or as a regression caused by this patch.
