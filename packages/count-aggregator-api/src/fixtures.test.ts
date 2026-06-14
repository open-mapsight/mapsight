import {describe, expect, it} from "vitest";

import lastValuesMapFixture from "./fixtures/last-values-map.json";
import problemsListFixture from "./fixtures/problems-list.json";
import stationListFixture from "./fixtures/station-list.json";
import stationSumsFixture from "./fixtures/station-sums.json";
import valuesMapFixture from "./fixtures/values-map.json";
import {schemas} from "./generated/client.js";
import {
	assertLocalDateTimeFields,
	indexTimeSeriesByStationId,
	parseTimeSeriesMap,
} from "./lib/responses.js";

describe("fixture response parsing", () => {
	it("parses station list fixture", () => {
		const parsed = schemas.StationListResponse.parse(stationListFixture);
		expect(parsed.data.length).toBeGreaterThan(0);
		expect(parsed.data[0]?.id).toBe(150);
		expect(parsed.data[0]?.origin_id).toBe("138969");
	});

	it("uses synthetic station display names in fixtures", () => {
		const parsed = schemas.StationListResponse.parse(stationListFixture);
		for (const station of parsed.data) {
			expect(station.name).toMatch(/^Example Counter [A-Z]$/);
			expect(station.label).toMatch(/^Example Counter [A-Z]$/);
		}
	});

	it("parses multi-station values map keyed by MSP id strings", () => {
		const map = parseTimeSeriesMap(valuesMapFixture);
		const indexed = indexTimeSeriesByStationId(map);

		expect(indexed.has(150)).toBe(true);
		expect(indexed.get(150)?.stationId).toBe("138969");
		assertLocalDateTimeFields(indexed.get(150)!);
	});

	it("parses last-values map with data points", () => {
		const map = parseTimeSeriesMap(lastValuesMapFixture);
		const entry = map["150"];

		expect(entry?.values.length).toBe(3);
		assertLocalDateTimeFields(entry!);
	});

	it("parses station overview sums fixture", () => {
		const parsed =
			schemas.StationOverviewResponse.parse(stationSumsFixture);

		expect(parsed.stationId).toBe(150);
		expect(parsed.lastDays.length).toBeGreaterThan(0);
		expect(parsed.dailyAverage.length).toBeGreaterThan(0);
	});

	it("parses problems list fixture", () => {
		expect(Array.isArray(problemsListFixture)).toBe(true);
		for (const problem of problemsListFixture) {
			schemas.DetectedDataProblem.parse(problem);
		}
	});
});
