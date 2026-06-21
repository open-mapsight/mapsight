import {useEffect, useMemo, useState} from "react";

import type {AsyncStatusView} from "@mapsight/ui/async-status";
import {AsyncStatusRegion} from "@mapsight/ui/async-status/components";

import {
	getCountAggregatorDictionary,
	resolveCountAggregatorLocale,
} from "../../lib/i18n.js";
import {getDocumentLocale} from "../../lib/utils.js";
import {resolveMetricWidgetConfig} from "../config/metric-widgets.js";
import {toCountAggregatorStationId} from "../lib/count-aggregator-station-id.js";
import {
	fetchMetricSumValue,
	fetchMetricTimeSeries,
} from "../lib/fetch-metric-data.js";
import type {MetricPlaceholderData, SmartCityMetricsOptions} from "../types.js";
import MetricWidgetShell from "./metric-widget-shell.js";
import TimeSeriesMetricChart from "./time-series-metric-chart.js";
import ValueMetricDisplay from "./value-metric-display.js";

type Props = MetricPlaceholderData & SmartCityMetricsOptions;

type MetricData =
	| {
			status: "ready";
			kind: "timeSeries";
			points: Awaited<ReturnType<typeof fetchMetricTimeSeries>>["points"];
			config: Awaited<ReturnType<typeof fetchMetricTimeSeries>>["config"];
			lastUpdatedAt: Date | null;
	  }
	| {
			status: "ready";
			kind: "sum";
			value: number | null;
			config: Awaited<ReturnType<typeof fetchMetricSumValue>>["config"];
			lastUpdatedAt: Date | null;
	  }
	| {status: "error"};

type MetricFetchState = {
	key: string;
	data: MetricData | null;
};

function metricDataToView(
	state: MetricFetchState,
	fetchKey: string,
): AsyncStatusView<MetricData> {
	const isLoading = state.key !== fetchKey || state.data === null;

	if (isLoading) {
		return {
			status: "pending",
			fetchStatus: "fetching",
			data: undefined,
			error: undefined,
		};
	}

	if (state.data === null) {
		return {
			status: "pending",
			fetchStatus: "fetching",
			data: undefined,
			error: undefined,
		};
	}

	if (state.data.status === "error") {
		return {
			status: "error",
			fetchStatus: "idle",
			data: undefined,
			error: true,
		};
	}

	return {
		status: "success",
		fetchStatus: "idle",
		data: state.data,
		error: undefined,
	};
}

export default function SmartCityMetricWidget({
	stationType,
	stationId,
	label,
	mapsightIconId,
	apiBaseUrl = "/msp/public/count-aggregator",
	showMetricIcons = false,
	getDataViewHref,
	dataViewLabel,
	getDownloadWizardHref,
	downloadWizardLabel,
}: Props) {
	const fetchKey = `${apiBaseUrl}|${stationType}|${stationId}|${label}`;
	const [state, setState] = useState<MetricFetchState>({
		key: fetchKey,
		data: null,
	});
	const dictionary = getCountAggregatorDictionary(
		resolveCountAggregatorLocale(getDocumentLocale()),
	);
	const apiStationId = Number(toCountAggregatorStationId(stationId));
	const view = useMemo(
		() => metricDataToView(state, fetchKey),
		[state, fetchKey],
	);

	useEffect(() => {
		let cancelled = false;
		const widgetConfig = resolveMetricWidgetConfig(stationType, label);

		async function loadMetric() {
			try {
				if (widgetConfig.kind === "timeSeries") {
					const result = await fetchMetricTimeSeries(
						apiBaseUrl,
						stationType,
						stationId,
						label,
					);

					if (!cancelled) {
						setState({
							key: fetchKey,
							data: {
								status: "ready",
								kind: "timeSeries",
								points: result.points,
								config: result.config,
								lastUpdatedAt: result.lastUpdatedAt,
							},
						});
					}

					return;
				}

				const result = await fetchMetricSumValue(
					apiBaseUrl,
					stationType,
					stationId,
					label,
					widgetConfig.kind,
				);

				if (!cancelled) {
					setState({
						key: fetchKey,
						data: {
							status: "ready",
							kind: "sum",
							value: result.value,
							config: result.config,
							lastUpdatedAt: result.lastUpdatedAt,
						},
					});
				}
			} catch {
				if (!cancelled) {
					setState({key: fetchKey, data: {status: "error"}});
				}
			}
		}

		void loadMetric();

		return () => {
			cancelled = true;
		};
	}, [apiBaseUrl, fetchKey, label, stationId, stationType]);

	const shellProps = {
		label,
		mapsightIconId,
		showMetricIcons,
		dataViewRequest: {
			stationType,
			stationIds: Number.isInteger(apiStationId)
				? [apiStationId]
				: undefined,
			mode: "comparison" as const,
		},
		dataViewHref: getDataViewHref?.({
			stationType,
			stationId,
			label,
			mapsightIconId,
		}),
		dataViewLabel,
		downloadWizardRequest: {
			stationType,
			stationIds: Number.isInteger(apiStationId)
				? [apiStationId]
				: undefined,
		},
		downloadWizardHref: getDownloadWizardHref?.({
			stationType,
			stationId,
			label,
			mapsightIconId,
		}),
		downloadWizardLabel,
	};

	const readyData = state.data?.status === "ready" ? state.data : null;
	const lastUpdatedAt = readyData?.lastUpdatedAt ?? null;

	return (
		<MetricWidgetShell {...shellProps} lastUpdatedAt={lastUpdatedAt}>
			<AsyncStatusRegion
				className="ms3-smart-city-metric__async-status"
				errorMessage={dictionary["metrics.error"]}
				loadingMessage={dictionary["metrics.loading"]}
				variant="placeholder"
				view={view}
			>
				{readyData?.kind === "timeSeries" ? (
					<TimeSeriesMetricChart
						config={readyData.config}
						points={readyData.points}
					/>
				) : null}
				{readyData?.kind === "sum" ? (
					<ValueMetricDisplay
						config={readyData.config}
						value={readyData.value}
					/>
				) : null}
			</AsyncStatusRegion>
		</MetricWidgetShell>
	);
}
