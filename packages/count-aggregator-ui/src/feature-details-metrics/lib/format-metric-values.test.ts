import {parseLocalDateTime} from "@mapsight/count-aggregator-api";
import {afterEach, describe, expect, it} from "vitest";

import {
	formatMetricDate,
	formatMetricTooltipTime,
	formatMetricTooltipValue,
} from "./format-metric-values.js";

const originalLang = document.documentElement.lang;

afterEach(() => {
	document.documentElement.lang = originalLang;
});

describe("formatMetricDate", () => {
	it("keeps the API calendar day for end-of-day lastDateTime", () => {
		document.documentElement.lang = "de";

		expect(
			formatMetricDate(parseLocalDateTime("2026-08-27 23:59:59")),
		).toBe("27.08.2026");
	});
});

describe("formatMetricTooltipTime", () => {
	it("includes clock time for short-interval resolutions", () => {
		document.documentElement.lang = "de";

		expect(
			formatMetricTooltipTime(new Date(2026, 7, 27, 14, 15), "15min"),
		).toBe("27.08., 14:15");
	});

	it("uses a date-only label for daily series", () => {
		document.documentElement.lang = "de";

		expect(
			formatMetricTooltipTime(new Date(2026, 7, 27, 14, 15), "daily"),
		).toBe("27.08.2026");
	});
});

describe("formatMetricTooltipValue", () => {
	it("includes the unit for ordinary measurements", () => {
		document.documentElement.lang = "de";

		expect(
			formatMetricTooltipValue(12.4, {
				kind: "timeSeries",
				decimals: 1,
				unit: "°C",
				variant: "default",
			}),
		).toBe("12,4 °C");
	});

	it("pairs the air-quality index with its band label", () => {
		document.documentElement.lang = "de";

		expect(
			formatMetricTooltipValue(2.87, {
				kind: "timeSeries",
				decimals: 0,
				variant: "airQualityIndex",
			}),
		).toBe("3 · gut");
	});
});
