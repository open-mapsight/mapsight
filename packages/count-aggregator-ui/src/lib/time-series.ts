import {
	type BucketMetric,
	type DataValuePoint,
	type TimeSeriesResponse,
	parseLocalDateTime,
} from "@mapsight/count-aggregator-api";

import type {StationValue} from "../types";
import {resolveBucketValue} from "./bucket-metrics.js";

export function mapDataValuePointsToChartPoints(
	points: readonly DataValuePoint[],
	metric: BucketMetric,
	mapValue: (value: number) => number = (value) => value,
): StationValue[] {
	const values: StationValue[] = [];

	for (const point of points) {
		const rawValue = resolveBucketValue(point, metric);
		if (rawValue === null) {
			continue;
		}

		values.push({
			date: parseLocalDateTime(point.datetime),
			value: mapValue(rawValue),
		});
	}

	return values;
}

export function mapTimeSeriesToChartPoints(
	series: TimeSeriesResponse,
	metric: BucketMetric,
	mapValue?: (value: number) => number,
): StationValue[] {
	return mapDataValuePointsToChartPoints(series.values, metric, mapValue);
}
