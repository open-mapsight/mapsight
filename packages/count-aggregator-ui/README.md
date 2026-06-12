# @mapsight/count-aggregator-ui

Embeddable React components for Mapsight **count-aggregator** data: station selection wizards, time-series charts, CSV export links, and optional map feature-detail metrics.

Uses [`@mapsight/count-aggregator-api`](../count-aggregator-api/README.md) for HTTP access. UI strings are German today; i18n is future work ([Phase 5](../count-aggregator-api/PLAN.md#phase-5--polish--long-term-notes)).

## Install

**npm** (when published):

```bash
npm install @mapsight/count-aggregator-ui @mapsight/count-aggregator-api
```

**pnpm workspace**:

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

Import the package stylesheet **once** in your app entry. Host-page Tailwind alone does not include the `msca:` prefixed utilities this package ships:

```ts
import "@mapsight/count-aggregator-ui/styles.css";
```

## Minimal embed

`CountAggregatorRoot` is **required** for correct portals, theme CSS variables, and isolation inside host pages (class `msp-count-aggregator`).

```tsx
import "@mapsight/count-aggregator-ui/styles.css";

import {
	CountAggregatorProvider,
	CountAggregatorRoot,
	CountAggregatorWizard,
	createStationTypeAppsConfig,
} from "@mapsight/count-aggregator-ui";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

const queryClient = new QueryClient();

// Station types normally come from GET /station-types on your API.
// Below: static sample for bootstrap before the network call returns.
const stationTypes = [{type: "bicycleCount", label: "Radzählstellen"}] as const;

const config = createStationTypeAppsConfig(stationTypes, {
	apiBaseUrl: "https://<tenant>.example.tld/msp/public/count-aggregator",
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
		<CountAggregatorRoot>
			<QueryClientProvider client={queryClient}>
				<CountAggregatorProvider config={config}>
					<CountAggregatorWizard appId="bicycleCount" />
				</CountAggregatorProvider>
			</QueryClientProvider>
		</CountAggregatorRoot>
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
	<CountAggregatorProvider config={config}>
		{/* routes or wizard */}
	</CountAggregatorProvider>
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

Main exports include `CountAggregatorWizard`, `TimeSeriesChart`, `OverviewChartPanel`, `useAggregatedValues`, `createTheme`, and smart-city metric mounts (see below).

## Embedding notes

- Wrap content in `CountAggregatorRoot` so dropdowns portal correctly and theme variables (`--msca-*`) apply.
- Optional theming: `createTheme({ colors: { primary: "#0066cc" } })` passed to `CountAggregatorRoot`.
- Wizard controls use the `msca:` Tailwind prefix to reduce clashes with host CMS styles.

## Run the demo locally

The [Mapsight showcase](../../apps/showcase) app includes a stepped `bicycleCount` wizard backed by a **mock API** — no live tenant or `.env` secrets.

```bash
# from repo root
pnpm install
pnpm --filter @mapsight/showcase dev
```

Open [http://localhost:5173/count-aggregator](http://localhost:5173/count-aggregator) (default Vite port).

The dev server serves JSON and CSV from `/mock/msp/public/count-aggregator`, reusing fixtures from `@mapsight/count-aggregator-api`. Implementation: `apps/showcase/count-aggregator-mock/` and `apps/showcase/src/count-aggregator/`.

For package development with live rebuilds:

```bash
pnpm --filter @mapsight/showcase dev:linked
```

## Smart-city metrics

`mountSmartCityMetrics` and `createSmartCityMetricsPartialContentHandler` integrate count-aggregator charts into map feature-detail panels via placeholder markup. These use the same API base URL pattern as the wizard. Details live in `src/feature-details-metrics/`; broader platform presets/events are not yet in the public OpenAPI contract.

## Testing

```bash
pnpm --filter @mapsight/count-aggregator-ui test
```

Current coverage focuses on feature-details metrics helpers, date utilities, and metric widget config. Hook, mapper, and wizard tests are planned in [Phase 4](../count-aggregator-api/PLAN.md#phase-4--testing--ci-confidence).

## Deprecated APIs

Legacy `createPlatformConfig`, `TrafficDataWizard`, `SmartCityWizard`, and `WheelCounterWizard` remain for older integrations. New work should use `createStationTypeAppsConfig` + `CountAggregatorWizard`. Migration notes will be added in [Phase 2](../count-aggregator-api/PLAN.md#phase-2--config--api-surface-cleanup).

## Related packages

- [`@mapsight/count-aggregator-api`](../count-aggregator-api/README.md) — HTTP client and OpenAPI types
- [API improvement plan](../count-aggregator-api/PLAN.md) — master roadmap
- [UI execution checklist](./PLAN.md) — UI-focused task list
