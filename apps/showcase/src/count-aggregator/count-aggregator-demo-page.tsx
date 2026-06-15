import "@mapsight/count-aggregator-ui/styles.css";

import {type ReactElement, useMemo} from "react";

import {
	CountAggregatorShell,
	CountAggregatorWizard,
	createStationTypeAppsConfig,
	useStationTypes,
} from "@mapsight/count-aggregator-ui";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import {COUNT_AGGREGATOR_MOCK_API_BASE} from "./constants.ts";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 0,
			refetchOnWindowFocus: false,
		},
	},
});

function CountAggregatorDemoBootstrap(): ReactElement {
	const {stationTypes, isPending, isError} = useStationTypes(
		COUNT_AGGREGATOR_MOCK_API_BASE,
	);

	const config = useMemo(() => {
		if (stationTypes === undefined) {
			return null;
		}

		const next = createStationTypeAppsConfig(stationTypes, {
			apiBaseUrl: COUNT_AGGREGATOR_MOCK_API_BASE,
		});

		if (next.apps.bicycleCount !== undefined) {
			next.apps.bicycleCount = {
				...next.apps.bicycleCount,
				uiVariant: "stepped",
				features: {
					resolutionSelect: true,
					chartTypeSelect: true,
					export: true,
					presets: false,
					events: false,
				},
			};
		}

		return next;
	}, [stationTypes]);

	if (isError) {
		return (
			<p className="count-aggregator-demo__status">
				Mock API unavailable. Run the showcase dev server so the
				count-aggregator middleware is active.
			</p>
		);
	}

	if (isPending || stationTypes === undefined || config === null) {
		return <p className="count-aggregator-demo__status">Loading demo…</p>;
	}

	return (
		<CountAggregatorShell
			config={config}
			queryClient={queryClient}
			className="count-aggregator-demo__surface"
		>
			<CountAggregatorWizard appId="bicycleCount" />
		</CountAggregatorShell>
	);
}

export function CountAggregatorDemoPage(): ReactElement {
	return (
		<div className="showcase-page count-aggregator-demo">
			<div className="showcase-page__hero">
				<h1>Count aggregator</h1>
				<p>
					Explore an embeddable reporting flow for public time series
					data. Pick stations, choose a time range, compare daily
					values, and export the result as a chart, table, or CSV.
				</p>
			</div>

			<QueryClientProvider client={queryClient}>
				<CountAggregatorDemoBootstrap />
			</QueryClientProvider>
		</div>
	);
}
