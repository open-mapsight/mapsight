import {afterEach, describe, expect, it, vi} from "vitest";

import {createCountAggregatorClient} from "./client.js";
import lastValuesMapFixture from "./fixtures/last-values-map.json";
import stationListFixture from "./fixtures/station-list.json";
import stationSumsFixture from "./fixtures/station-sums.json";
import valuesMapFixture from "./fixtures/values-map.json";
import {
	getLastValues,
	getStationSums,
	getValues,
	listStationTypes,
	listStations,
} from "./helpers.js";

const baseUrl = "https://example.test/msp/public/count-aggregator";

function createMockFetch(handler: (url: string) => unknown): typeof fetch {
	return vi.fn(async (input: string | URL | Request) => {
		const url =
			typeof input === "string"
				? input
				: input instanceof URL
					? input.toString()
					: input.url;

		return {
			ok: true,
			status: 200,
			headers: new Headers({"content-type": "application/json"}),
			json: async () => handler(url),
		} as Response;
	}) as unknown as typeof fetch;
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
						type: "bicycleCount",
						label: "Bicycle count",
						station_count: 1,
					},
				],
			};
		});

		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});
		const result = await listStationTypes(client);

		expect(result.data[0]?.type).toBe("bicycleCount");
	});

	it("lists stations for a station type", async () => {
		const fetchFn = createMockFetch((url) => {
			expect(url).toBe(
				`${baseUrl}/bicycleCount/stations?includeEmpty=true`,
			);
			return stationListFixture;
		});

		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});
		const result = await listStations(client, "bicycleCount", {
			includeEmpty: true,
		});

		expect(result.data[0]?.id).toBe(150);
	});

	it("gets aggregated values", async () => {
		const fetchFn = createMockFetch((url) => {
			expect(url).toBe(
				`${baseUrl}/bicycleCount/values/2025-06-01/2025-06-07/daily?stationIds=150%2C151`,
			);
			return valuesMapFixture;
		});

		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});
		const result = await getValues(client, {
			type: "bicycleCount",
			from: "2025-06-01",
			to: "2025-06-07",
			resolution: "daily",
			stationIds: [150, 151],
		});

		expect(result["150"]?.id).toBe(150);
	});

	it("gets last values", async () => {
		const fetchFn = createMockFetch((url) => {
			expect(url).toBe(
				`${baseUrl}/bicycleCount/last-values/hourly?stationIds=150&limit=3&startDate=2025-06-01`,
			);
			return lastValuesMapFixture;
		});

		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});
		const result = await getLastValues(client, {
			type: "bicycleCount",
			resolution: "hourly",
			stationIds: [150],
			limit: 3,
			startDate: "2025-06-01",
		});

		expect(result["150"]?.values.length).toBe(3);
	});

	it("gets station sums", async () => {
		const fetchFn = createMockFetch((url) => {
			expect(url).toBe(`${baseUrl}/bicycleCount/150/sums`);
			return stationSumsFixture;
		});

		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});
		const result = await getStationSums(client, "bicycleCount", 150);

		expect(result.stationId).toBe(150);
	});
});
