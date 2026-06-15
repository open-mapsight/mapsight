import {
	type DataValuePoint,
	type TimeSeriesResponse,
	parseLocalDateTime,
} from "@mapsight/count-aggregator-api";

import type {StationValue} from "../types";

export function mapDataValuePointsToChartPoints(
	points: readonly DataValuePoint[],
	mapValue: (value: number) => number = (value) => value,
): StationValue[] {
	return points.map(({datetime, value}) => ({
		date: parseLocalDateTime(datetime),
		value: mapValue(value),
	}));
}

export function mapTimeSeriesToChartPoints(
	series: TimeSeriesResponse,
	mapValue?: (value: number) => number,
): StationValue[] {
	return mapDataValuePointsToChartPoints(series.values, mapValue);
}
