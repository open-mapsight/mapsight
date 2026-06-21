import {describe, expect, it} from "vitest";

import {
	formatMetricAxisValue,
	formatMetricValue,
} from "./format-metric-value.js";

describe("formatMetricValue", () => {
	it("appends the unit when present", () => {
		expect(
			formatMetricValue(
				42.456,
				{displayPrecision: 2, unit: "mNN"},
				"de-DE",
			),
		).toBe("42,46 mNN");
	});

	it("omits the unit for dimensionless counters", () => {
		expect(
			formatMetricValue(128, {displayPrecision: 0, unit: null}, "de-DE"),
		).toBe("128");
	});
});

describe("formatMetricAxisValue", () => {
	it("formats axis ticks without repeating the unit suffix", () => {
		expect(
			formatMetricAxisValue(
				42.456,
				{displayPrecision: 2, unit: "°C"},
				"de-DE",
			),
		).toBe("42,46");
	});
});
