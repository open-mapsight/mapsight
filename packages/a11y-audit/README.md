# @mapsight/a11y-audit

Rerunnable accessibility audit for Mapsight integrations. One config describes
the pages that embed Mapsight (a full-page map, CMS embeds, standalone apps) and
the user tasks to replay on them; every run produces the same kind of report,
so results can be compared over time and attributed to whoever has to fix them.

What a run does, per target and viewport:

| Check          | What it does                                                                                                                                                                                                                                                                                                                                                 | WCAG                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `axe`          | [axe-core](https://github.com/dequelabs/axe-core) with WCAG 2.0–2.2 A/AA and best-practice rules, scoped to the integration root plus dialogs portalled outside it. Violations are failures; “incomplete” results (e.g. contrast over the map canvas) are _needs review_.                                                                                    | many                                             |
| `keyboard`     | Tabs from just before the integration until focus leaves it. Each stop: role and name (Chromium accessibility tree), visible while focused, not fully covered, and a visible focus indicator (computed styles and pixels compared focused vs. blurred). Detects traps, long sequences without a skip link, and pointer-clickable elements Tab never reaches. | 2.1.1, 2.1.2, 2.4.1, 2.4.3, 2.4.7, 2.4.11, 4.1.2 |
| `dialogs`      | Every `aria-expanded` / `aria-haspopup` trigger: opens it with Enter (then Space, then a click — a click-only control fails), checks `aria-expanded`, the dialog’s name, initial focus, focus containment in modals, Escape, and focus return. Runs axe on each opened state.                                                                                | 2.1.1, 2.4.3, 4.1.2                              |
| `map`          | The map surface has a role and name, can take keyboard focus, and pans with the arrow keys (map pixels compared).                                                                                                                                                                                                                                            | 1.1.1, 2.1.1, 4.1.2                              |
| `language`     | Names, labels, titles and placeholders against a lexicon of English Mapsight/OpenLayers UI strings, on pages in other languages.                                                                                                                                                                                                                             | 3.1.2                                            |
| `text-spacing` | Applies the 1.4.12 spacing values and reports text that becomes clipped.                                                                                                                                                                                                                                                                                     | 1.4.12                                           |
| `reflow`       | At 320 CSS px: elements that cause horizontal page scrolling (the map itself is exempt) and controls clipped away.                                                                                                                                                                                                                                           | 1.4.10                                           |

Scenarios replay tasks (search, select a list entry, switch a module …) and run
checks on the resulting state; they can require a live-region announcement
(4.1.3) or that focus ends in a given place (2.4.3).

What a run produces (`--out`, default `a11y-report/`):

- `report.json` — everything, machine-readable; input for the next run’s `--baseline`.
- `report.md` — summary by owner and impact, failures grouped across targets with
  WCAG reference, element, example, fix hint and fingerprint, _needs review_ list,
  a WCAG 2.2 A/AA coverage matrix, the manual test catalogue, the tab order per
  state, and a scenario log (steps, announcements, errors).
- `screenshots/` — one per state.

## Objectivity rules

- **Fingerprints** identify a finding by rule, target, owner and a stable element
  pattern (classes without state/modifier/hash tokens, no `nth-child`). They do
  not depend on viewport, scenario or data, so a baseline diff reports real
  changes: `new`, `fixed`, `unchanged`.
- **Owners** come from the config: the closest ancestor that matches an owner’s
  selector wins; nodes outside the integration root belong to the host page.
  The Mapsight preset adds `openlayers` (`ol-*`) and `@mapsight/ui` (`ms3-*`)
  after the host’s owners. Attribution is a hint for routing, not proof.
- **Impact** uses axe-core’s scale. For Mapsight checks it is fixed per rule (see
  `src/rules.ts`): _critical_ blocks a core task, _serious_ is an A/AA failure
  with a workaround or on a secondary task, _moderate_ is limited in scope or a
  strong APG deviation, _minor_ is best practice.
- **Coverage**: every WCAG 2.2 A/AA criterion is listed with the automated rules
  and manual tests that cover it. A criterion only becomes `pass` when its manual
  tests pass; automation alone yields `fail` or `incomplete`.
- **Determinism**: Chromium only, `prefers-reduced-motion: reduce`, fixed
  viewports and device scale factor 1, one browser context per target and
  viewport, fresh page load per state. Live data still changes; compare
  fingerprints, not counts.

## Usage

```bash
pnpm add -D @mapsight/a11y-audit
pnpm exec playwright install chromium   # once per machine

pnpm exec mapsight-a11y-audit run --config a11y/audit.config.mts --out a11y/reports/2026-10-27
# later, against the previous run, failing CI on new serious problems:
pnpm exec mapsight-a11y-audit run --config a11y/audit.config.mts --out a11y/reports/latest \
  --baseline a11y/reports/2026-10-27/report.json --fail-on serious --fail-on-new
```

A run exits with code 2 when a page, scenario or check fails to execute; an incomplete run cannot pass a CI gate. `--fail-on-new` requires `--baseline`. Exit code 1 indicates findings at the configured impact threshold.

Unknown or empty target, viewport and scenario filters are rejected before Chromium starts. Each selected target needs an applicable viewport, and requested scenarios must apply to the selected targets/viewports. Use `--scenario initial` to run only the initial states. Concurrency must be a positive integer.

Useful options: `--target stadtplan,tk-map-list`, `--viewport desktop`,
`--scenario search-street`, `--base-url http://localhost:5173` (audit a dev
server or a test system with the same config), `--concurrency 3`, `--headed`,
`--browser /path/to/chrome` (or `MAPSIGHT_A11Y_BROWSER`).

### Manual tests

Automated checks cannot judge everything (screen reader output, contrast on the
map, meaningful order …). The catalogue in `src/manual-tests.ts` (also printed
in every report) gives each manual test fixed steps and a pass criterion.

```bash
pnpm exec mapsight-a11y-audit manual-template --config a11y/audit.config.mts > a11y/manual-results.json
# fill in result: pass | fail | n/a | not-tested (+ notes, optional wcag: ["3.3.1"] to narrow a failure)
pnpm exec mapsight-a11y-audit report --input a11y/reports/latest/report.json --manual a11y/manual-results.json
```

`target: "*"` applies a result to every target.

## Config

```ts
import type {AuditConfig} from "@mapsight/a11y-audit";

export default {
	name: "Mapsight on example.org",
	baseUrl: "https://www.example.org",
	locale: "de-DE",
	navigationTimeoutMs: 120_000, // default 60_000; targets can override this
	preset: "mapsight", // owners, map selectors and English lexicon for Mapsight
	hostOwner: "host page (CMS template)",
	owners: [{id: "my-host-app", selector: '[class^="my-"], [class*=" my-"]'}],
	// viewports default to desktop 1280×800, mobile 390×844 (touch) and reflow 320×640
	targets: [
		{
			id: "city-map",
			title: "City map",
			url: "/map/",
			root: "#map-embed", // integration root; checks and axe are scoped to it
			readySelector: "#map-embed .ms3-list__item",
			features: ["map", "list", "search", "details"], // selects manual tests
			scenarios: [
				{
					id: "search",
					title: "Search a street",
					run: async ({root, page, step}) => {
						step('type "Main Street"');
						await root.getByRole("searchbox").fill("Main Street");
						await root.getByRole("searchbox").press("Enter");
						await page.waitForTimeout(2000);
					},
					expectAnnouncement: true, // 4.1.3
					checks: ["axe", "keyboard"],
				},
			],
		},
	],
} satisfies AuditConfig;
```

Config files are loaded with Node’s type stripping, so `.mts` works without a
build step; `import type` lines are erased at runtime.

Per viewport, `checks` lists what runs on the initial state (default: desktop
runs all but `reflow`, mobile runs `axe`, `keyboard`, `dialogs`, reflow runs
`axe` and `reflow`). Scenarios default to `axe`.

A target with `skip: "reason"` (e.g. not public yet) is listed in the report
and only runs when selected with `--target`.

## Programmatic use

```ts
import {runAudit, writeReport} from "@mapsight/a11y-audit";

const report = await runAudit({config, outDir: "a11y-report"});
await writeReport(report, "a11y-report");
```

## Limits

- Chromium only; screen reader behaviour is not simulated (manual tests cover it).
- The focus-indicator check catches missing indicators, not weak ones (1.4.11 contrast of the ring is a manual test).
- Owner attribution follows class names; components that reuse another owner’s classes are attributed to the closest match.
- Checks interact with the live page (focus, Enter/Escape, a click when keys fail). Point it at public pages or test systems, not at forms that submit data.
