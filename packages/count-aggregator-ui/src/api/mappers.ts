import type {
	StationListResponse,
	TimeSeriesMapResponse,
} from "@mapsight/count-aggregator-api";

import {mapTimeSeriesToChartPoints} from "../lib/time-series.js";
import type {AggregatedValuesData, Station} from "../types";

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
): AggregatedValuesData {
	const stationsById = new Map<
		number,
		{stationId: number; values: {date: Date; value: number}[]}
	>();

	for (const [key, series] of Object.entries(map)) {
		const stationId = Number(key);
		stationsById.set(stationId, {
			stationId,
			values: mapTimeSeriesToChartPoints(series),
		});
	}

	return {stationsById};
}
