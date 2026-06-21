import {afterEach, describe, expect, it, vi} from "vitest";

import {createCountAggregatorClient} from "./client.js";
import stationListFixture from "./fixtures/station-list.json";
import valuesMapFixture from "./fixtures/values-map.json";
import {schemas} from "./generated/client.js";
import {parseTimeSeriesMap} from "./lib/responses.js";

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

describe("createCountAggregatorClient", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("fetches and validates station list", async () => {
		const fetchFn = createMockFetch((url) => {
			expect(url).toBe(`${baseUrl}/bicycleSensorTotal/stations`);
			return stationListFixture;
		});

		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});
		const result = schemas.StationListResponse.parse(
			await client["count-aggregator.public.type.stations"]({
				params: {type: "bicycleSensorTotal"},
			}),
		);

		expect(result.data[0]?.id).toBe(150);
	});

	it("fetches and validates multi-station values", async () => {
		const fetchFn = createMockFetch((url) => {
			expect(url).toBe(
				`${baseUrl}/bicycleSensorTotal/values/2025-06-01/2025-06-07/daily?stationIds=150`,
			);
			return valuesMapFixture;
		});

		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});
		const result = parseTimeSeriesMap(
			await client["count-aggregator.public.type.values"]({
				params: {
					type: "bicycleSensorTotal",
					from: "2025-06-01",
					to: "2025-06-07",
					resolution: "daily",
				},
				queries: {
					stationIds: "150",
				},
			}),
		);

		expect(result["150"]?.id).toBe(150);
	});

	it("throws CountAggregatorApiError on HTTP errors", async () => {
		const fetchFn = vi.fn(async () => ({
			ok: false,
			status: 404,
			headers: new Headers(),
			json: async () => ({}),
		})) as unknown as typeof fetch;

		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});

		await expect(
			client["count-aggregator.public.type.stations"]({
				params: {type: "bicycleSensorTotal"},
			}),
		).rejects.toMatchObject({status: 404});
	});
});
