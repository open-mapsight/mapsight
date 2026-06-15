import {
	createCountAggregatorClient,
	getStationLastValues,
	getStationSums,
	parseLocalDateTime,
} from "@mapsight/count-aggregator-api";

import {mapTimeSeriesToChartPoints} from "../../lib/time-series.js";
import {resolveMetricWidgetConfig} from "../config/metric-widgets.js";
import type {
	MetricPlaceholderData,
	MetricSeriesPoint,
	MetricWidgetConfig,
} from "../types.js";
import {toCountAggregatorStationId} from "./count-aggregator-station-id.js";

/** Anchor last-values windows at each station's last_data_at instead of now. */
export const FEATURE_DETAILS_LAST_VALUES_ANCHOR = "lastDataAt" as const;

function scaleValue(value: number, config: MetricWidgetConfig): number {
	return config.valueScale ? value * config.valueScale : value;
}

export async function fetchMetricTimeSeries(
	apiBaseUrl: string,
	stationType: MetricPlaceholderData["stationType"],
	stationId: string,
	stationLabel: string,
): Promise<{
	config: MetricWidgetConfig;
	points: MetricSeriesPoint[];
	lastUpdatedAt: Date | null;
}> {
	const config = resolveMetricWidgetConfig(stationType, stationLabel);
	const client = createCountAggregatorClient(apiBaseUrl);
	const apiStationId = toCountAggregatorStationId(stationId);
	const response = await getStationLastValues(client, {
		type: stationType,
		stationId: apiStationId,
		resolution: config.resolution ?? "daily",
		limit: config.limit,
		anchor: FEATURE_DETAILS_LAST_VALUES_ANCHOR,
	});

	return {
		config,
		points: mapTimeSeriesToChartPoints(response, (value) =>
			scaleValue(value, config),
		) satisfies MetricSeriesPoint[],
		lastUpdatedAt: response.lastDateTime
			? parseLocalDateTime(response.lastDateTime)
			: null,
	};
}

export async function fetchMetricSumValue(
	apiBaseUrl: string,
	stationType: MetricPlaceholderData["stationType"],
	stationId: string,
	stationLabel: string,
	kind: "sumTotal" | "sumLastDay",
): Promise<{
	config: MetricWidgetConfig;
	value: number | null;
	lastUpdatedAt: Date | null;
}> {
	const config = resolveMetricWidgetConfig(stationType, stationLabel);
	const client = createCountAggregatorClient(apiBaseUrl);
	const apiStationId = toCountAggregatorStationId(stationId);
	const response = await getStationSums(client, stationType, apiStationId);

	let rawValue: number | null;
	let lastUpdatedAt: Date | null;

	if (kind === "sumTotal") {
		rawValue = response.total ?? null;
		const lastDay = response.lastDays.at(-1);
		lastUpdatedAt = lastDay?.datetime
			? parseLocalDateTime(lastDay.datetime)
			: null;
	} else {
		const lastDay = response.lastDays.at(-1);
		rawValue = lastDay?.value ?? null;
		lastUpdatedAt = lastDay?.datetime
			? parseLocalDateTime(lastDay.datetime)
			: null;
	}

	return {
		config,
		value: rawValue === null ? null : scaleValue(rawValue, config),
		lastUpdatedAt,
	};
}
