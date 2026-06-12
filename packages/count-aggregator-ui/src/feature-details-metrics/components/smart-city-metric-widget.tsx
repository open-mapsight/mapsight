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

type MetricState =
	| {status: "loading"}
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

export default function SmartCityMetricWidget({
	stationType,
	stationId,
	label,
	mapsightIconId,
	apiBaseUrl = "/msp/public/count-aggregator",
	showMetricIcons = false,
}: Props) {
	const [state, setState] = useState<MetricState>({status: "loading"});

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
							status: "ready",
							kind: "timeSeries",
							points: result.points,
							config: result.config,
							lastUpdatedAt: result.lastUpdatedAt,
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
						status: "ready",
						kind: "sum",
						value: result.value,
						config: result.config,
						lastUpdatedAt: result.lastUpdatedAt,
					});
				}
			} catch {
				if (!cancelled) {
					setState({status: "error"});
				}
			}
		}

		setState({status: "loading"});
		void loadMetric();

		return () => {
			cancelled = true;
		};
	}, [apiBaseUrl, label, stationId, stationType]);

	const shellProps = {
		label,
		mapsightIconId,
		showMetricIcons,
	};

	if (state.status === "loading") {
		return (
			<MetricWidgetShell {...shellProps} lastUpdatedAt={null}>
				<div className="ms3-smart-city-metric__loading">
					Lade Messwerte …
				</div>
			</MetricWidgetShell>
		);
	}

	if (state.status === "error") {
		return (
			<MetricWidgetShell {...shellProps} lastUpdatedAt={null}>
				<div className="ms3-smart-city-metric__empty">
					Messwerte konnten nicht geladen werden
				</div>
			</MetricWidgetShell>
		);
	}

	return (
		<MetricWidgetShell {...shellProps} lastUpdatedAt={state.lastUpdatedAt}>
			{state.kind === "timeSeries" ? (
				<TimeSeriesMetricChart
					points={state.points}
					config={state.config}
				/>
			) : (
				<ValueMetricDisplay value={state.value} config={state.config} />
			)}
		</MetricWidgetShell>
	);
}
