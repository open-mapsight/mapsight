import {describe, expect, it} from "vitest";

import {resolveMetricWidgetConfig} from "./metric-widgets.js";

describe("resolveMetricWidgetConfig", () => {
	it("uses daily last-30-days defaults for count stations", () => {
		expect(
			resolveMetricWidgetConfig("peopleCount", "Damm (Anzahl Passanten)"),
		).toEqual({
			kind: "timeSeries",
			resolution: "daily",
			limit: 30,
			chartType: "area",
			decimals: 0,
			variant: "default",
		});
	});

	it("uses short-interval weather defaults", () => {
		expect(
			resolveMetricWidgetConfig(
				"weatherTemp",
				"Temperatur Moosmodule (°C)",
			),
		).toEqual({
			kind: "timeSeries",
			resolution: "15min",
			limit: 96,
			chartType: "area",
			decimals: 1,
			variant: "default",
		});
	});

	it("maps cumulative air-quality names to sum widgets", () => {
		expect(
			resolveMetricWidgetConfig(
				"airQualityPM10",
				"Lungenvolumen gefilterte Luft gesamt",
			).kind,
		).toBe("sumTotal");

		expect(
			resolveMetricWidgetConfig(
				"airQualityPM10",
				"Lungenvolumen gefilterte Luft 24h",
			).kind,
		).toBe("sumLastDay");
	});

	it("uses hourly air-quality index widgets with band variant", () => {
		expect(
			resolveMetricWidgetConfig(
				"airQualityPM10Index",
				"Luftqualitätsindex (PM10)",
			),
		).toMatchObject({
			kind: "timeSeries",
			resolution: "hourly",
			limit: 24,
			variant: "airQualityIndex",
		});
	});

	it("uses a compass variant for wind direction", () => {
		expect(
			resolveMetricWidgetConfig(
				"weatherWindDirection",
				"Windrichtung (°)",
			),
		).toMatchObject({
			variant: "windDirection",
			resolution: "15min",
		});
	});

	it("uses water defaults for underground levels", () => {
		expect(
			resolveMetricWidgetConfig(
				"waterLevelUnderground",
				"Grundwasserstand",
			),
		).toMatchObject({
			resolution: "hourly",
			limit: 48,
			decimals: 2,
		});
	});
});
