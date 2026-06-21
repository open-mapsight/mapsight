import type {StationTypeSummary} from "@mapsight/count-aggregator-api";
import {describe, expect, it} from "vitest";

import {groupStationTypesByCategory} from "./station-type-categories.js";

const weatherEntry = {
	type: "weatherTemp",
	label: "Lufttemperatur",
	station_count: 3,
	category: {id: "weather", label: "Wetter"},
	defaultMetric: "mean",
	supportedResolutions: ["hourly", "daily"],
	metrics: [
		{
			id: "temp",
			label: "Temperatur",
			unit: "°C",
			displayPrecision: 1,
			defaultMetric: "mean",
			aggregation: ["mean", "min", "max"],
		},
	],
} as const satisfies StationTypeSummary;

const airQualityEntry = {
	type: "airQualityPM25",
	label: "Luftqualität PM2.5",
	station_count: 2,
	category: {id: "airQuality", label: "Luftqualität"},
	defaultMetric: "mean",
	supportedResolutions: ["hourly", "daily"],
	metrics: [
		{
			id: "pm25",
			label: "PM2.5",
			unit: "µg/m³",
			displayPrecision: 1,
			defaultMetric: "mean",
			aggregation: ["mean"],
		},
	],
} as const satisfies StationTypeSummary;

const mobilityEntry = {
	type: "bicycleSensorTotal",
	label: "Radzählstellen",
	station_count: 9,
	category: {id: "mobility", label: "Mobilität"},
	defaultMetric: "sum",
	supportedResolutions: ["daily"],
	metrics: [
		{
			id: "count",
			label: "Radfahrer",
			unit: null,
			displayPrecision: 0,
			defaultMetric: "sum",
			aggregation: ["sum"],
		},
	],
} as const satisfies StationTypeSummary;

describe("groupStationTypesByCategory", () => {
	it("groups station types by API category", () => {
		const groups = groupStationTypesByCategory([
			mobilityEntry,
			weatherEntry,
			airQualityEntry,
		]);

		expect(groups).toEqual([
			{
				category: {id: "mobility", label: "Mobilität"},
				stationTypes: [mobilityEntry],
			},
			{
				category: {id: "weather", label: "Wetter"},
				stationTypes: [weatherEntry],
			},
			{
				category: {id: "airQuality", label: "Luftqualität"},
				stationTypes: [airQualityEntry],
			},
		]);
	});
});
