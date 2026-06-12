import {
	type StationOverviewResponse,
	type TimeSeriesResponse,
	createCountAggregatorClient,
	parseLocalDateTime,
} from "@mapsight/count-aggregator-api";

import {resolveMetricWidgetConfig} from "../config/metric-widgets.js";
import type {
	MetricPlaceholderData,
	MetricSeriesPoint,
	MetricWidgetConfig,
} from "../types.js";
import {toCountAggregatorStationId} from "./count-aggregator-station-id.js";

export const DEFAULT_SMART_CITY_API_BASE_URL = "/msp/public/count-aggregator";

/** Anchor last-values windows at each station's last_data_at instead of now. */
export const FEATURE_DETAILS_LAST_VALUES_ANCHOR = "lastDataAt" as const;

function scaleValue(value: number, config: MetricWidgetConfig): number {
	return config.valueScale ? value * config.valueScale : value;
}

function mapTimeSeriesValues(
	response: TimeSeriesResponse,
	config: MetricWidgetConfig,
): MetricSeriesPoint[] {
	return response.values.map(({datetime, value}) => ({
		date: parseLocalDateTime(datetime),
		value: scaleValue(value, config),
	}));
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
	const response = (await client[
		"count-aggregator.public.type.station.last-values"
	]({
		params: {
			type: stationType,
			stationId: apiStationId,
			resolution: config.resolution ?? "daily",
		},
		queries: {
			limit: config.limit,
			anchor: FEATURE_DETAILS_LAST_VALUES_ANCHOR,
		},
	})) as TimeSeriesResponse;

	return {
		config,
		points: mapTimeSeriesValues(response, config),
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
	const response = (await client["count-aggregator.public.type.sums"]({
		params: {
			type: stationType,
			stationId: apiStationId,
		},
	})) as StationOverviewResponse;

	let rawValue: number | null = null;
	let lastUpdatedAt: Date | null = null;

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
