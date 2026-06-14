import type {
	StationListResponse,
	TimeSeriesMapResponse,
} from "@mapsight/count-aggregator-api";
import {describe, expect, it} from "vitest";

import {mapStationList, mapTimeSeriesMap} from "./mappers.js";

describe("mapStationList", () => {
	it("maps API station summaries by MSP id", () => {
		const response: StationListResponse = {
			data: [
				{
					id: 150,
					type: "bicycleCount",
					origin_id: "138969",
					name: "Example Counter A",
					status: null,
					label: "Example Counter A",
					hasData: true,
					lastDataAt: "2026-06-10 22:00:00",
				},
			],
		};

		const result = mapStationList(response);

		expect(result.get(150)).toEqual({
			id: 150,
			typeName: "bicycleCount",
			status: null,
			label: "Example Counter A",
			originId: "138969",
		});
	});
});

describe("mapTimeSeriesMap", () => {
	it("maps API time series maps to chart points keyed by station id", () => {
		const response: TimeSeriesMapResponse = {
			"150": {
				id: 150,
				fromDateTime: "2026-06-01 00:00:00",
				toDateTime: "2026-06-02 00:00:00",
				lastDateTime: "2026-06-02 00:00:00",
				resolution: "daily",
				stationId: "138969",
				values: [
					{datetime: "2026-06-01 00:00:00", value: 12},
					{datetime: "2026-06-02 00:00:00", value: 24},
				],
			},
		};

		const result = mapTimeSeriesMap(response);
		const station = result.stationsById.get(150);

		expect(station?.stationId).toBe(150);
		expect(station?.values).toHaveLength(2);
		expect(station?.values[0]).toEqual({
			date: new Date(Date.UTC(2026, 5, 1, 0, 0, 0)),
			value: 12,
		});
	});

	it("handles empty maps", () => {
		expect(mapTimeSeriesMap({}).stationsById.size).toBe(0);
	});
});
