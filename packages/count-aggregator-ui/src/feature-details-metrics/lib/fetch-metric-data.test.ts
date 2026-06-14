import {afterEach, describe, expect, it, vi} from "vitest";

import {
	FEATURE_DETAILS_LAST_VALUES_ANCHOR,
	fetchMetricTimeSeries,
} from "./fetch-metric-data.js";

const baseUrl = "https://example.test/msp/public/count-aggregator";

describe("fetchMetricTimeSeries", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("requests last values anchored at lastDataAt", async () => {
		const fetchFn = vi.fn(async (input: string | URL | Request) => {
			const url =
				typeof input === "string"
					? input
					: input instanceof URL
						? input.toString()
						: input.url;

			expect(url).toBe(
				`${baseUrl}/peopleCount/75/last-values/daily?limit=30&anchor=lastDataAt`,
			);

			return {
				ok: true,
				status: 200,
				headers: new Headers({"content-type": "application/json"}),
				json: async () => ({
					id: 75,
					fromDateTime: "2026-06-01 00:00:00",
					toDateTime: "2026-06-10 23:59:59",
					lastDateTime: "2026-06-10 23:59:59",
					resolution: "daily",
					stationId: "135688",
					values: [],
				}),
			} as Response;
		});

		vi.stubGlobal("fetch", fetchFn);

		await fetchMetricTimeSeries(
			baseUrl,
			"peopleCount",
			"msp-75",
			"Damm (Anzahl Passanten)",
		);

		expect(fetchFn).toHaveBeenCalledOnce();
		expect(FEATURE_DETAILS_LAST_VALUES_ANCHOR).toBe("lastDataAt");
	});
});
