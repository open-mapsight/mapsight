import {afterEach, describe, expect, it, vi} from "vitest";

import {createCountAggregatorClient} from "./client.js";
import lastValuesMapFixture from "./fixtures/last-values-map.json";
import stationListFixture from "./fixtures/station-list.json";
import stationSumsFixture from "./fixtures/station-sums.json";
import valuesMapFixture from "./fixtures/values-map.json";
import {
	getLastValues,
	getStationLastValues,
	getStationSums,
	getValues,
	getValuesQuery,
	listStationTypes,
	listStations,
} from "./helpers.js";

const baseUrl = "https://example.test/msp/public/count-aggregator";

function createMockFetch(handler: (url: string) => unknown): typeof fetch {
	return vi.fn((input: string | URL | Request) => {
		const url =
			typeof input === "string"
				? input
				: input instanceof URL
					? input.toString()
					: input.url;

		return Promise.resolve({
			ok: true,
			status: 200,
			headers: new Headers({"content-type": "application/json"}),
			json: () => handler(url),
		} as Response);
	});
}

describe("typed endpoint helpers", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("lists station types", async () => {
		const fetchFn = createMockFetch((url) => {
			expect(url).toBe(`${baseUrl}/station-types`);
			return {
				data: [
					{
						type: "bicycleSensorTotal",
						label: "Bicycle count",
						station_count: 1,
						category: {id: "mobility", label: "Mobility"},
						defaultMetric: "sum",
						supportedResolutions: ["daily"],
						metrics: [
							{
								id: "count",
								label: "Bicycle count",
								unit: null,
								displayPrecision: 0,
								defaultMetric: "sum",
								aggregation: ["sum"],
							},
						],
					},
				],
			};
		});

		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});
		const result = await listStationTypes(client);

		expect(result.data[0]?.type).toBe("bicycleSensorTotal");
	});

	it("ignores unknown station types instead of failing the list", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const fetchFn = createMockFetch(() => ({
			data: [
				{
					type: "bicycleSensorTotal",
					label: "Bicycle count",
					station_count: 1,
					category: {id: "mobility", label: "Mobility"},
					defaultMetric: "sum",
					supportedResolutions: ["daily"],
					metrics: [
						{
							id: "count",
							label: "Bicycle count",
							unit: null,
							displayPrecision: 0,
							defaultMetric: "sum",
							aggregation: ["sum"],
						},
					],
				},
				{
					type: "brandNewSensorType",
					label: "Brand new",
					station_count: 2,
					category: {id: "other", label: "Other"},
					defaultMetric: "mean",
					supportedResolutions: ["hourly"],
					metrics: [
						{
							id: "value",
							label: "Value",
							unit: null,
							displayPrecision: 0,
							defaultMetric: "mean",
							aggregation: ["mean"],
						},
					],
				},
			],
		}));

		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});
		const result = await listStationTypes(client);

		expect(result.data.map((entry) => entry.type)).toEqual([
			"bicycleSensorTotal",
		]);
		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0]?.[0])).toContain(
			'Ignoring unknown or invalid station type "brandNewSensorType"',
		);
	});

	it("lists stations for a station type", async () => {
		const fetchFn = createMockFetch((url) => {
			expect(url).toBe(
				`${baseUrl}/bicycleSensorTotal/stations?includeEmpty=true`,
			);
			return stationListFixture;
		});

		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});
		const result = await listStations(client, "bicycleSensorTotal", {
			includeEmpty: true,
		});

		expect(result.data[0]?.id).toBe(150);
	});

	it("gets aggregated values with metrics", async () => {
		const fetchFn = createMockFetch((url) => {
			expect(url).toBe(
				`${baseUrl}/waterLevelSurface/values/2025-06-01/2025-06-07/hourly?stationIds=140&metrics=mean%2Cmin%2Cmax`,
			);
			return valuesMapFixture;
		});

		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});
		const result = await getValues(client, {
			type: "waterLevelSurface",
			from: "2025-06-01",
			to: "2025-06-07",
			resolution: "hourly",
			stationIds: [140],
			metrics: ["mean", "min", "max"],
		});

		expect(result["150"]?.id).toBe(150);
	});

	it("gets datetime query values", async () => {
		const fetchFn = createMockFetch((url) => {
			expect(url).toBe(
				`${baseUrl}/waterLevelSurface/values?stationIds=140&from=2025-06-01+10%3A00%3A00&to=2025-06-01+12%3A00%3A00&resolution=15min&metrics=mean`,
			);
			return valuesMapFixture;
		});

		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});
		await getValuesQuery(client, {
			type: "waterLevelSurface",
			from: "2025-06-01 10:00:00",
			to: "2025-06-01 12:00:00",
			resolution: "15min",
			stationIds: [140],
			metrics: ["mean"],
		});
	});

	it("gets last values", async () => {
		const fetchFn = createMockFetch((url) => {
			expect(url).toBe(
				`${baseUrl}/bicycleSensorTotal/last-values/hourly?stationIds=150&limit=3&startDate=2025-06-01&anchor=lastDataAt`,
			);
			return lastValuesMapFixture;
		});

		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});
		const result = await getLastValues(client, {
			type: "bicycleSensorTotal",
			resolution: "hourly",
			stationIds: [150],
			limit: 3,
			startDate: "2025-06-01",
			anchor: "lastDataAt",
		});

		expect(result["150"]?.values.length).toBe(3);
	});

	it("gets single-station last values", async () => {
		const fetchFn = createMockFetch((url) => {
			expect(url).toBe(
				`${baseUrl}/bicycleSensorTotal/150/last-values/daily?limit=3&anchor=lastDataAt`,
			);
			return lastValuesMapFixture["150"];
		});

		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});
		const result = await getStationLastValues(client, {
			type: "bicycleSensorTotal",
			stationId: 150,
			resolution: "daily",
			limit: 3,
			anchor: "lastDataAt",
		});

		expect(result.id).toBe(150);
	});

	it("gets station sums", async () => {
		const fetchFn = createMockFetch((url) => {
			expect(url).toBe(`${baseUrl}/bicycleSensorTotal/150/sums`);
			return stationSumsFixture;
		});

		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});
		const result = await getStationSums(client, "bicycleSensorTotal", 150);

		expect(result.stationId).toBe(150);
	});
});
