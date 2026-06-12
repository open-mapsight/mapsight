import {useEffect, useState} from "react";

import {resolveMetricWidgetConfig} from "../config/metric-widgets.js";
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

export default function SmartCityMetricWidget({
	stationType,
	stationId,
	label,
	mapsightIconId,
	apiBaseUrl = "/msp/public/count-aggregator",
	showMetricIcons = false,
}: Props) {
	const fetchKey = `${apiBaseUrl}|${stationType}|${stationId}|${label}`;
	const [state, setState] = useState<MetricFetchState>({
		key: fetchKey,
		data: null,
	});
	const isLoading = state.key !== fetchKey || state.data === null;

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
	};

	if (isLoading) {
		return (
			<MetricWidgetShell {...shellProps} lastUpdatedAt={null}>
				<div className="ms3-smart-city-metric__loading">
					Lade Messwerte …
				</div>
			</MetricWidgetShell>
		);
	}

	const data = state.data;

	if (data?.status === "error") {
		return (
			<MetricWidgetShell {...shellProps} lastUpdatedAt={null}>
				<div className="ms3-smart-city-metric__empty">
					Messwerte konnten nicht geladen werden
				</div>
			</MetricWidgetShell>
		);
	}

	if (data?.status !== "ready") {
		return null;
	}

	return (
		<MetricWidgetShell {...shellProps} lastUpdatedAt={data.lastUpdatedAt}>
			{data.kind === "timeSeries" ? (
				<TimeSeriesMetricChart
					points={data.points}
					config={data.config}
				/>
			) : (
				<ValueMetricDisplay value={data.value} config={data.config} />
			)}
		</MetricWidgetShell>
	);
}
