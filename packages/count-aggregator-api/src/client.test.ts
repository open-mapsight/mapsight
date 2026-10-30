import {afterEach, describe, expect, it, vi} from "vitest";

import {createCountAggregatorClient} from "./client.js";
import stationListFixture from "./fixtures/station-list.json";
import valuesMapFixture from "./fixtures/values-map.json";
import {schemas} from "./generated/client.js";
import {parseTimeSeriesMap} from "./lib/responses.js";
import {createMockFetch} from "./test-helpers.js";

const baseUrl = "https://example.test/msp/public/count-aggregator";

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
		const fetchFn = vi.fn(() =>
			Promise.resolve({
				ok: false,
				status: 404,
				headers: new Headers(),
				json: () => ({}),
			} as Response),
		) as unknown as typeof fetch;

		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});

		await expect(
			client["count-aggregator.public.type.stations"]({
				params: {type: "bicycleSensorTotal"},
			}),
		).rejects.toMatchObject({status: 404});
	});

	it("adds default and configured request headers", async () => {
		const fetchFn = createMockFetch(() => stationListFixture);
		const client = createCountAggregatorClient(baseUrl, {
			fetch: fetchFn,
			headers: {Authorization: "Bearer token"},
		});

		await client["count-aggregator.public.type.stations"]({
			params: {type: "bicycleSensorTotal"},
		});

		expect(fetchFn).toHaveBeenCalledWith(
			`${baseUrl}/bicycleSensorTotal/stations`,
			{
				method: "GET",
				headers: {
					Accept: "application/json",
					Authorization: "Bearer token",
				},
			},
		);
	});

	it("omits undefined queries and encodes path and query values", async () => {
		const fetchFn = createMockFetch((url) => {
			expect(url).toBe(
				`${baseUrl}/type%20with%2Fslash/values/2025-06-01%2010%3A00/2025-06-01%2012%3A00/daily?stationIds=150+%26+151`,
			);
			return valuesMapFixture;
		});
		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});

		await client["count-aggregator.public.type.values"]({
			params: {
				type: "type with/slash",
				from: "2025-06-01 10:00",
				to: "2025-06-01 12:00",
				resolution: "daily",
			},
			queries: {
				stationIds: "150 & 151",
				metrics: undefined,
			},
		});
	});

	it("rejects responses that do not match the endpoint schema", async () => {
		const fetchFn = createMockFetch(() => ({data: [{id: "not-a-number"}]}));
		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});

		await expect(
			client["count-aggregator.public.type.stations"]({
				params: {type: "bicycleSensorTotal"},
			}),
		).rejects.toMatchObject({name: "ZodError"});
	});

	it("propagates transport failures", async () => {
		const transportError = new TypeError("network unavailable");
		const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(transportError);
		const client = createCountAggregatorClient(baseUrl, {fetch: fetchFn});

		await expect(
			client["count-aggregator.public.type.stations"]({
				params: {type: "bicycleSensorTotal"},
			}),
		).rejects.toBe(transportError);
	});
});
