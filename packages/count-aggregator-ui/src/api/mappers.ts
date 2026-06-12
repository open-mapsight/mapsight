import {
	parseLocalDateTime,
	parseTimeSeriesMap,
	schemas,
} from "@mapsight/count-aggregator-api";

import type {AggregatedValuesData, Station} from "../types";

export function mapStationList(response: unknown): Map<number, Station> {
	const {data} = schemas.StationListResponse.parse(response);

	return new Map(
		data.map((entry) => [
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

export function mapTimeSeriesMap(map: unknown): AggregatedValuesData {
	const record = parseTimeSeriesMap(map);
	const stationsById = new Map<
		number,
		{stationId: number; values: {date: Date; value: number}[]}
	>();

	for (const [key, series] of Object.entries(record)) {
		const stationId = Number(key);
		stationsById.set(stationId, {
			stationId,
			values: series.values.map((point) => ({
				date: parseLocalDateTime(point.datetime),
				value: point.value,
			})),
		});
	}

	return {stationsById};
}
