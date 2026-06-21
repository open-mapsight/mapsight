import type {
	BucketMetric,
	StationListResponse,
	TimeSeriesMapResponse,
} from "@mapsight/count-aggregator-api";

import {mapDataValuePointsToChartPoints} from "../lib/time-series.js";
import type {AggregatedValuesData, Station, StationData} from "../types";

export function mapStationList(
	response: StationListResponse,
): Map<number, Station> {
	return new Map(
		response.data.map((entry) => [
			entry.id,
			{
				id: entry.id,
				typeName: entry.type,
				status: entry.status,
				label: entry.label,
				originId: entry.origin_id,
			},
		]),
	);
}

export function mapTimeSeriesMap(
	map: TimeSeriesMapResponse,
	metrics: readonly BucketMetric[],
): AggregatedValuesData {
	const stationsById = new Map<number, StationData>();

	for (const [key, series] of Object.entries(map)) {
		const stationId = Number(key);
		const valuesByMetric: Partial<
			Record<
				BucketMetric,
				ReturnType<typeof mapDataValuePointsToChartPoints>
			>
		> = {};

		for (const metric of metrics) {
			const values = mapDataValuePointsToChartPoints(
				series.values,
				metric,
			);
			if (values.length > 0) {
				valuesByMetric[metric] = values;
			}
		}

		const primaryMetric = metrics[0];
		stationsById.set(stationId, {
			stationId,
			values:
				primaryMetric !== undefined
					? (valuesByMetric[primaryMetric] ?? [])
					: [],
			valuesByMetric,
		});
	}

	return {stationsById};
}
