import "@mapsight/count-aggregator-ui/styles.css";

import {type ReactElement, useMemo} from "react";

import {
	CountAggregatorProvider,
	CountAggregatorRoot,
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
		<CountAggregatorProvider config={config}>
			<CountAggregatorWizard appId="bicycleCount" />
		</CountAggregatorProvider>
	);
}

export function CountAggregatorDemoPage(): ReactElement {
	return (
		<div className="count-aggregator-demo">
			<div className="count-aggregator-demo__intro">
				<h1>Count aggregator</h1>
				<p>
					Stepped wizard wired to a <strong>mock API</strong> served
					by the showcase dev server at{" "}
					<code>{COUNT_AGGREGATOR_MOCK_API_BASE}</code>. No live
					Mapsight tenant or secrets required.
				</p>
			</div>

			<CountAggregatorRoot className="count-aggregator-demo__surface">
				<QueryClientProvider client={queryClient}>
					<CountAggregatorDemoBootstrap />
				</QueryClientProvider>
			</CountAggregatorRoot>
		</div>
	);
}
