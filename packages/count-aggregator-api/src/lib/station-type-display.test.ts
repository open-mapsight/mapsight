import {describe, expect, it} from "vitest";

import type {StationTypeSummary} from "../types.js";
import {resolveStationTypeDisplay} from "./station-type-display.js";

const waterLevelType = {
	type: "waterLevelSurface",
	label: "Oker Pegel",
	station_count: 3,
	category: {id: "hydrology", label: "Hydrologie"},
	defaultMetric: "mean",
	supportedResolutions: ["hourly", "daily"],
	metrics: [
		{
			id: "water_level",
			label: "Pegelmessung",
			unit: "mNN",
			displayPrecision: 2,
			defaultMetric: "mean",
			aggregation: ["mean", "min", "max", "last"],
		},
	],
} as const satisfies StationTypeSummary;

describe("resolveStationTypeDisplay", () => {
	it("uses the primary metric matching defaultMetric", () => {
		expect(resolveStationTypeDisplay(waterLevelType)).toEqual({
			primaryMetricLabel: "Pegelmessung",
			valueUnit: "mNN",
			displayPrecision: 2,
		});
	});

	it("returns dimensionless defaults when metrics are absent", () => {
		expect(
			resolveStationTypeDisplay({
				type: "bicycleSensorTotal",
				label: "Radverkehr",
				station_count: 1,
				category: {id: "mobility", label: "Mobilität"},
				defaultMetric: "sum",
				supportedResolutions: ["daily"],
				metrics: [],
			}),
		).toEqual({
			primaryMetricLabel: "Radverkehr",
			valueUnit: null,
			displayPrecision: 0,
		});
	});
});
