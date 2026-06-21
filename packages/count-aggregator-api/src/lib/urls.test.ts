import {describe, expect, it} from "vitest";

import {
	buildCsvExportUrl,
	buildLastValuesCsvExportUrl,
	buildMultipleLastValuesUrl,
	buildMultipleValuesQueryUrl,
	buildMultipleValuesUrl,
	buildSingleStationLastValuesUrl,
	buildSingleStationValuesUrl,
	buildStationSumsUrl,
	buildStationsGeoJsonUrl,
	buildStationsUrl,
	buildValuesQueryCsvExportUrl,
} from "./urls.js";

const baseUrl = "https://example.test/msp/public/count-aggregator";

describe("count aggregator URL builders", () => {
	it("builds a multi-station values URL", () => {
		const url = buildMultipleValuesUrl(baseUrl, {
			type: "bicycleCount",
			from: "2025-01-01",
			to: "2025-01-07",
			resolution: "daily",
			stationIds: [150, 151],
			metrics: ["sum"],
		});

		expect(url).toBe(
			"https://example.test/msp/public/count-aggregator/bicycleCount/values/2025-01-01/2025-01-07/daily?stationIds=150%2C151&metrics=sum",
		);
	});

	it("builds a datetime query values URL", () => {
		const url = buildMultipleValuesQueryUrl(baseUrl, {
			type: "waterLevelSurface",
			from: "2025-06-01 10:00:00",
			to: "2025-06-01 12:00:00",
			resolution: "15min",
			stationIds: [140],
			metrics: ["mean", "min", "max"],
		});

		expect(url).toBe(
			"https://example.test/msp/public/count-aggregator/waterLevelSurface/values?stationIds=140&from=2025-06-01+10%3A00%3A00&to=2025-06-01+12%3A00%3A00&resolution=15min&metrics=mean%2Cmin%2Cmax",
		);
	});

	it("builds a CSV export URL", () => {
		const url = buildCsvExportUrl(baseUrl, {
			type: "bicycleCount",
			from: "2025-01-01",
			to: "2025-01-07",
			resolution: "daily",
			stationIds: [150],
		});

		expect(url).toContain("format=csv");
		expect(url).toContain("stationIds=150");
	});

	it("builds a last-values URL with optional params", () => {
		const url = buildMultipleLastValuesUrl(baseUrl, {
			type: "bicycleCount",
			resolution: "monthly",
			stationIds: [150],
			limit: 12,
			startDate: "2024-01-01",
			anchor: "lastDataAt",
		});

		expect(url).toBe(
			"https://example.test/msp/public/count-aggregator/bicycleCount/last-values/monthly?stationIds=150&limit=12&startDate=2024-01-01&anchor=lastDataAt",
		);
	});

	it("builds last-values CSV export URL", () => {
		const url = buildLastValuesCsvExportUrl(baseUrl, {
			type: "bicycleCount",
			resolution: "daily",
			stationIds: [150],
			limit: 7,
			anchor: "lastDataAt",
			metrics: ["sum"],
		});

		expect(url).toContain("format=csv");
		expect(url).toContain("stationIds=150");
		expect(url).toContain("limit=7");
		expect(url).toContain("anchor=lastDataAt");
		expect(url).toContain("metrics=sum");
	});

	it("builds datetime query CSV export URL", () => {
		const url = buildValuesQueryCsvExportUrl(baseUrl, {
			type: "waterLevelSurface",
			from: "2025-06-01 10:00:00",
			to: "2025-06-01 12:00:00",
			resolution: "15min",
			stationIds: [140],
			metrics: ["mean"],
		});

		expect(url).toContain("format=csv");
		expect(url).toContain("metrics=mean");
	});

	it("builds single-station URLs", () => {
		expect(
			buildSingleStationValuesUrl(baseUrl, {
				type: "bicycleCount",
				stationId: 150,
				from: "2025-01-01",
				to: "2025-01-07",
				resolution: "daily",
			}),
		).toBe(
			"https://example.test/msp/public/count-aggregator/bicycleCount/150/values/2025-01-01/2025-01-07/daily",
		);

		expect(
			buildSingleStationLastValuesUrl(baseUrl, {
				type: "bicycleCount",
				stationId: 150,
				resolution: "daily",
				limit: 7,
				anchor: "lastDataAt",
			}),
		).toBe(
			"https://example.test/msp/public/count-aggregator/bicycleCount/150/last-values/daily?limit=7&anchor=lastDataAt",
		);

		expect(buildStationSumsUrl(baseUrl, "bicycleCount", 150)).toBe(
			"https://example.test/msp/public/count-aggregator/bicycleCount/150/sums",
		);
	});

	it("builds station list and geojson URLs", () => {
		expect(buildStationsUrl(baseUrl, "bicycleCount")).toBe(
			"https://example.test/msp/public/count-aggregator/bicycleCount/stations",
		);
		expect(buildStationsGeoJsonUrl(baseUrl, "bicycleCount")).toBe(
			"https://example.test/msp/public/count-aggregator/stations.geojson?type=bicycleCount",
		);
	});

	it("supports relative base URLs for browser apps", () => {
		const relativeBase = "/msp/public/count-aggregator";

		expect(
			buildMultipleLastValuesUrl(relativeBase, {
				type: "bicycleCount",
				resolution: "daily",
				stationIds: [150],
				limit: 7,
			}),
		).toBe(
			"/msp/public/count-aggregator/bicycleCount/last-values/daily?stationIds=150&limit=7",
		);

		expect(
			buildLastValuesCsvExportUrl(relativeBase, {
				type: "bicycleCount",
				resolution: "daily",
				stationIds: [150],
				limit: 7,
			}),
		).toBe(
			"/msp/public/count-aggregator/bicycleCount/last-values/daily?stationIds=150&limit=7&format=csv",
		);

		expect(buildStationsGeoJsonUrl(relativeBase, "bicycleCount")).toBe(
			"/msp/public/count-aggregator/stations.geojson?type=bicycleCount",
		);
	});
});
