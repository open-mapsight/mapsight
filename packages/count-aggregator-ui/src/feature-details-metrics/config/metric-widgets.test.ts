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
});
