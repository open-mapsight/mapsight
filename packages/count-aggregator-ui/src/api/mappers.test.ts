import type {
	BucketMetric,
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
					type: "bicycleSensorTotal",
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
			typeName: "bicycleSensorTotal",
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
					{datetime: "2026-06-01 00:00:00", sum: 12, value: 12},
					{datetime: "2026-06-02 00:00:00", sum: 24, value: 24},
				],
			},
		};

		const result = mapTimeSeriesMap(response, ["sum"]);
		const station = result.stationsById.get(150);

		expect(station?.stationId).toBe(150);
		expect(station?.values).toHaveLength(2);
		expect(station?.values[0]).toEqual({
			date: new Date(Date.UTC(2026, 5, 1, 0, 0, 0)),
			value: 12,
		});
		expect(station?.valuesByMetric.sum).toHaveLength(2);
	});

	it("maps multiple bucket metrics for the same station", () => {
		const response: TimeSeriesMapResponse = {
			"140": {
				id: 140,
				fromDateTime: "2026-06-01 00:00:00",
				toDateTime: "2026-06-01 23:00:00",
				lastDateTime: "2026-06-01 23:00:00",
				resolution: "hourly",
				stationId: "102977",
				values: [
					{
						datetime: "2026-06-01 10:00:00",
						mean: 42.4,
						min: 31,
						max: 58,
						value: 42.4,
					},
				],
			},
		};

		const result = mapTimeSeriesMap(response, ["mean", "min", "max"]);
		const station = result.stationsById.get(140);

		expect(station?.valuesByMetric.mean?.[0]?.value).toBe(42.4);
		expect(station?.valuesByMetric.min?.[0]?.value).toBe(31);
		expect(station?.valuesByMetric.max?.[0]?.value).toBe(58);
	});

	it("handles empty maps", () => {
		expect(mapTimeSeriesMap({}, ["sum"]).stationsById.size).toBe(0);
	});
});

describe("resolveBucketValue", () => {
	it("prefers explicit metric fields over value alias", async () => {
		const {resolveBucketValue} = await import("../lib/bucket-metrics.js");

		expect(
			resolveBucketValue(
				{
					datetime: "2026-06-01 00:00:00",
					mean: 42.4,
					value: 99,
				},
				"mean",
			),
		).toBe(42.4);
	});
});
