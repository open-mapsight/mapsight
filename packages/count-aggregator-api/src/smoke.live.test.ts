import {describe, expect, it} from "vitest";

import {createCountAggregatorClient} from "./client.js";
import {schemas} from "./generated/client.js";
import {
	assertLocalDateTimeFields,
	indexTimeSeriesByStationId,
	parseTimeSeriesMap,
} from "./lib/responses.js";

const stationType = "bicycleSensorTotal" as const;

function readLiveSmokeEnv(): {baseUrl: string} | null {
	if (process.env.SMOKE_COUNT_AGGREGATOR_API !== "1") {
		return null;
	}

	const baseUrl = process.env.COUNT_AGGREGATOR_API_BASE;
	if (baseUrl === undefined || baseUrl.length === 0) {
		return null;
	}

	return {baseUrl};
}

const liveSmokeEnv = readLiveSmokeEnv();

describe.skipIf(liveSmokeEnv === null)(
	"live count-aggregator API smoke",
	() => {
		it("loads stations", async () => {
			const {baseUrl} = liveSmokeEnv!;
			const client = createCountAggregatorClient(baseUrl);
			const result = schemas.StationListResponse.parse(
				await client["count-aggregator.public.type.stations"]({
					params: {type: stationType},
				}),
			);

			expect(result.data.length).toBeGreaterThan(0);
		});

		it("runs stations → values → last-values → sums for bicycleSensorTotal", async () => {
			const {baseUrl} = liveSmokeEnv!;
			const client = createCountAggregatorClient(baseUrl);
			const {data: stations} = schemas.StationListResponse.parse(
				await client["count-aggregator.public.type.stations"]({
					params: {type: stationType},
				}),
			);
			const stationId = stations[0]?.id;
			expect(stationId).toBeTypeOf("number");
			if (stationId === undefined) {
				throw new Error(
					"Expected at least one bicycleSensorTotal station.",
				);
			}

			const values = parseTimeSeriesMap(
				await client["count-aggregator.public.type.values"]({
					params: {
						type: stationType,
						from: "2025-06-01",
						to: "2025-06-07",
						resolution: "daily",
					},
					queries: {
						stationIds: String(stationId),
					},
				}),
			);
			const valuesById = indexTimeSeriesByStationId(values);
			assertLocalDateTimeFields(valuesById.get(stationId)!);

			const lastValues = parseTimeSeriesMap(
				await client["count-aggregator.public.type.last-values"]({
					params: {
						type: stationType,
						resolution: "daily",
					},
					queries: {
						stationIds: String(stationId),
						limit: 3,
					},
				}),
			);
			assertLocalDateTimeFields(
				indexTimeSeriesByStationId(lastValues).get(stationId)!,
			);

			const sums = schemas.StationOverviewResponse.parse(
				await client["count-aggregator.public.type.sums"]({
					params: {type: stationType, stationId: String(stationId)},
				}),
			);
			expect(sums.stationId).toBe(stationId);
		});

		it("returns CSV from values endpoint", async () => {
			const {baseUrl} = liveSmokeEnv!;
			const client = createCountAggregatorClient(baseUrl);
			const {data: stations} = schemas.StationListResponse.parse(
				await client["count-aggregator.public.type.stations"]({
					params: {type: stationType},
				}),
			);
			const stationId = stations[0]?.id;
			if (stationId === undefined) {
				throw new Error(
					"Expected at least one bicycleSensorTotal station.",
				);
			}

			const response = await fetch(
				`${baseUrl}/${stationType}/values/2025-06-01/2025-06-07/daily?stationIds=${stationId}&format=csv`,
			);

			expect(response.status).toBe(200);
			expect(response.headers.get("content-type")).toContain("text/csv");
			const body = await response.text();
			expect(body).toContain("Zeitpunkt");
		});
	},
);
