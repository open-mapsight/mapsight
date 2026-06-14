# @mapsight/count-aggregator-ui

Embeddable React components for Mapsight **count-aggregator** data: station selection wizards, time-series charts, CSV
export links, and optional map feature-detail metrics.

Uses [`@mapsight/count-aggregator-api`](https://github.com/open-mapsight/mapsight/blob/main/packages/count-aggregator-api/README.md) for HTTP access. Built-in labels support `de` and `en` with optional per-key overrides.

See the [documentation hub](https://github.com/open-mapsight/mapsight/blob/main/docs/README.md) for ecosystem and integration context.

## Install

```bash
npm install @mapsight/count-aggregator-ui @mapsight/count-aggregator-api
# or
pnpm add @mapsight/count-aggregator-ui @mapsight/count-aggregator-api
```

**Monorepo development** (from repo root):

```bash
pnpm --filter @mapsight/count-aggregator-ui build
```

## Peer dependencies

Install these in your app (they are not bundled):

| Package                 | Why                                                      |
| ----------------------- | -------------------------------------------------------- |
| `react`, `react-dom`    | Components and hooks                                     |
| `@tanstack/react-query` | Data fetching in `useStations`, `useAggregatedValues`, … |
| `react-select`          | Multi-select station picker                              |
| `@mapsight/ui`          | Shared form controls and layout primitives               |

## Required CSS

Import the package stylesheet **once** in your app entry. Host-page Tailwind alone does not include the `msca:` prefixed
utilities this package ships:

```ts
import "@mapsight/count-aggregator-ui/styles.css";
```

## Minimal embed

`CountAggregatorShell` is the default embed wrapper. It sets up React Query, package config, and the root element needed
for portals, theme CSS variables, and isolation inside host pages (class `msp-count-aggregator`).

```tsx
import "@mapsight/count-aggregator-ui/styles.css";

import {
	CountAggregatorShell,
	CountAggregatorWizard,
	createStationTypeAppsConfig,
} from "@mapsight/count-aggregator-ui";

// Station types normally come from GET /station-types on your API.
// Below: static sample for bootstrap before the network call returns.
const stationTypes = [{type: "bicycleCount", label: "Radzählstellen"}] as const;

const config = createStationTypeAppsConfig(stationTypes, {
	apiBaseUrl: "https://<tenant>.example.tld/msp/public/count-aggregator",
	locale: "en",
});

// Optional: override per-app UI (stepped wizard, chart defaults, features)
config.apps.bicycleCount = {
	...config.apps.bicycleCount,
	uiVariant: "stepped",
	features: {
		resolutionSelect: true,
		chartTypeSelect: true,
		export: true,
		presets: false,
		events: false,
	},
};

export function CountAggregatorEmbed() {
	return (
		<CountAggregatorShell config={config}>
			<CountAggregatorWizard appId="bicycleCount" />
		</CountAggregatorShell>
	);
}
```

### Config loading pattern

Production apps usually fetch station types first, then build config:

```tsx
import {
	createStationTypeAppsConfig,
	useStationTypes,
} from "@mapsight/count-aggregator-ui";

const apiBaseUrl = "https://<tenant>.example.tld/msp/public/count-aggregator";
const {stationTypes, isPending} = useStationTypes(apiBaseUrl);

const config =
	stationTypes === undefined
		? null
		: createStationTypeAppsConfig(stationTypes, {apiBaseUrl});

if (isPending || config === null) {
	return <p>Loading…</p>;
}

return (
	<CountAggregatorShell config={config}>
		{/* routes or wizard */}
	</CountAggregatorShell>
);
```

Key config fields on each app (`CountAggregatorAppConfig`):

- `stationType` — API path segment (e.g. `bicycleCount`)
- `uiVariant` — `"stepped"` (selection → result) or `"single-page"`
- `defaultResolution`, `resolutions` — `hourly` … `yearly`
- `features` — toggles for resolution select, chart type, CSV export, presets, events

## Exports

| Entry                                      | Use when                                                            |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `@mapsight/count-aggregator-ui`            | Full UI: wizards, charts, provider, hooks                           |
| `@mapsight/count-aggregator-ui/headless`   | Hooks, date helpers, chart data prep — no CSS, no styled components |
| `@mapsight/count-aggregator-ui/styles.css` | Required stylesheet (see above)                                     |

Main exports include `CountAggregatorShell`, `CountAggregatorWizard`, `TimeSeriesChart`, `OverviewChartPanel`,
`useAggregatedValues`, `createTheme`, and smart-city metric mounts (see below).

The `/headless` entry also exports chart data helpers such as `prepareChartValues` and `mapTimeSeriesToChartPoints` for
custom UIs that do not use the styled wizard.

## CMS app-shell embed

For host CMS pages that paste HTML rather than bundle your app, use the public Vite plugins:

- [`@mapsight/vite-host-embed`](https://github.com/open-mapsight/mapsight/tree/main/packages/vite-host-embed) — `mapsightSnippetHtmlEntryPlugin` (build only the marked snippet region)
- [`@mapsight/vite-count-aggregator-embed`](https://github.com/open-mapsight/mapsight/tree/main/packages/vite-count-aggregator-embed) — assets-only deploy tree + `dist/snippets/count-aggregator.html`

Mark the paste-ready region in your HTML entry with `<!-- mapsight:snippet:start/end -->`, run `vite build`, deploy `assets/` + `.htaccess`, and paste the generated snippet into the CMS page.

## Embedding notes

- `CountAggregatorShell` composes `CountAggregatorRoot`, TanStack Query, and `CountAggregatorProvider` for the common
  embed case.
- Use the lower-level `CountAggregatorRoot` / `CountAggregatorProvider` exports when your host app already owns a shared
  `QueryClientProvider`.
- Optional theming: `createTheme({ colors: { primary: "#0066cc" } })` passed to `CountAggregatorRoot`.
- Wizard controls use the `msca:` Tailwind prefix to reduce clashes with host CMS styles.

## Run the demo locally

The [Mapsight showcase](https://github.com/open-mapsight/mapsight/tree/main/apps/showcase) app includes a stepped `bicycleCount` wizard backed by a **mock API** — no live tenant or `.env` secrets.

```bash
# from repo root
pnpm install
pnpm --filter @mapsight/showcase dev
```

Open [http://localhost:5173/count-aggregator](http://localhost:5173/count-aggregator) (default Vite port).

The dev server serves JSON and CSV from `/mock/msp/public/count-aggregator`, reusing fixtures from
`@mapsight/count-aggregator-api`. Implementation: `apps/showcase/count-aggregator-mock/` and
`apps/showcase/src/count-aggregator/`.

For package development with live rebuilds:

```bash
pnpm --filter @mapsight/showcase dev:linked
```

## Smart-city metrics

`mountSmartCityMetrics` and `createSmartCityMetricsPartialContentHandler` integrate count-aggregator charts into map
feature-detail panels via placeholder markup. These use the same API base URL pattern as the wizard. Details live in
`src/feature-details-metrics/`; broader platform presets/events are not yet in the public OpenAPI contract.

## Testing

```bash
pnpm --filter @mapsight/count-aggregator-ui test
pnpm --filter @mapsight/showcase test:e2e
```

Current unit coverage focuses on feature-details metrics helpers, date utilities, API mappers, chart data preparation, and metric widget config. The showcase e2e opens the mock count-aggregator demo, selects a station in the stepped wizard, advances to the result step, and asserts the chart/CSV path.

## Configuration

Load station types from the public API, build config with `createStationTypeAppsConfig`, and render
`CountAggregatorWizard` inside `CountAggregatorShell`:

```tsx
const apiBaseUrl = "https://<tenant>.example.tld/msp/public/count-aggregator";
const {stationTypes, isPending} = useStationTypes(apiBaseUrl);

if (isPending || stationTypes === undefined) {
	return <p>Loading…</p>;
}

const config = createStationTypeAppsConfig(stationTypes, {apiBaseUrl});

return (
	<CountAggregatorShell config={config}>
		<CountAggregatorWizard appId="bicycleCount" />
	</CountAggregatorShell>
);
```

Feature flags should be configured via `features` on each app:

```ts
features: {
	resolutionSelect: true,
	chartTypeSelect: true,
	export: true,
	presets: false,
	events: false,
}
```

`features` is the only source of truth for enabling optional UI. Platform-only URLs in `endpoints` are used only when
the matching feature is enabled, for example `features.events` with `endpoints.events` or `features.presets` with
`endpoints.presets`.

Set `locale: "de"` or `locale: "en"` on `CountAggregatorConfig` to choose built-in UI labels. Omit `locale` to derive it
from `document.documentElement.lang` with German fallback. Use `translations` for individual label overrides while the
project keeps the long-term i18n library decision open.

## Related packages

- [`@mapsight/count-aggregator-api`](https://github.com/open-mapsight/mapsight/blob/main/packages/count-aggregator-api/README.md) — HTTP client and OpenAPI types
- [API improvement plan](https://github.com/open-mapsight/mapsight/blob/main/packages/count-aggregator-api/PLAN.md) — master roadmap
- [UI execution checklist](https://github.com/open-mapsight/mapsight/blob/main/packages/count-aggregator-ui/PLAN.md) — UI-focused task list
