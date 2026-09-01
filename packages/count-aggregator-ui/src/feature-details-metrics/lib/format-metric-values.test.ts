import {parseLocalDateTime} from "@mapsight/count-aggregator-api";
import {afterEach, describe, expect, it} from "vitest";

import {
	formatMetricAxisTime,
	formatMetricDate,
	formatMetricTooltipTime,
	formatMetricTooltipValue,
	resolveMetricAxisTimeKind,
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

describe("formatMetricAxisTime", () => {
	it("uses clock time for short-interval resolutions", () => {
		document.documentElement.lang = "de";

		expect(
			formatMetricAxisTime(new Date(2026, 7, 27, 14, 15), "15min"),
		).toBe("14:15");
	});

	it("uses a date label for daily midnight UTC instead of local 02:00", () => {
		document.documentElement.lang = "de";

		expect(
			formatMetricAxisTime(
				parseLocalDateTime("2026-08-27 00:00:00"),
				"daily",
			),
		).toBe("27.08.");
	});

	it("uses a month label for monthly series", () => {
		document.documentElement.lang = "de";

		expect(
			formatMetricAxisTime(
				parseLocalDateTime("2026-08-01 00:00:00"),
				"monthly",
			),
		).toMatch(/Aug/i);
	});

	it("treats evenly spaced day buckets as dates even without a resolution", () => {
		document.documentElement.lang = "de";
		const timestamps = [
			Date.UTC(2026, 7, 1),
			Date.UTC(2026, 7, 2),
			Date.UTC(2026, 7, 3),
		];

		expect(resolveMetricAxisTimeKind(undefined, timestamps)).toBe("date");
		expect(
			formatMetricAxisTime(
				new Date(timestamps[0]!),
				undefined,
				timestamps,
			),
		).toBe("01.08.");
	});

	it("keeps clock labels for intra-day spacing without a resolution", () => {
		const timestamps = [
			Date.UTC(2026, 7, 27, 12, 0),
			Date.UTC(2026, 7, 27, 12, 15),
			Date.UTC(2026, 7, 27, 12, 30),
		];

		expect(resolveMetricAxisTimeKind(undefined, timestamps)).toBe("clock");
	});
});

describe("formatMetricTooltipTime", () => {
	it("includes clock time for short-interval resolutions", () => {
		document.documentElement.lang = "de";

		expect(
			formatMetricTooltipTime(
				parseLocalDateTime("2026-08-27 14:15:00"),
				"15min",
			),
		).toBe("27.08., 14:15");
	});

	it("includes clock time for hourly series", () => {
		document.documentElement.lang = "de";

		expect(
			formatMetricTooltipTime(
				parseLocalDateTime("2026-08-27 14:15:00"),
				"hourly",
			),
		).toBe("27.08., 14:15");
	});

	it("uses a date-only label for daily series", () => {
		document.documentElement.lang = "de";

		expect(
			formatMetricTooltipTime(
				parseLocalDateTime("2026-08-27 23:59:59"),
				"daily",
			),
		).toBe("27.08.2026");
	});

	it("uses a month label for monthly series", () => {
		document.documentElement.lang = "de";

		expect(
			formatMetricTooltipTime(
				parseLocalDateTime("2026-08-01 00:00:00"),
				"monthly",
			),
		).toBe("August 2026");
	});

	it("uses a year label for yearly series", () => {
		document.documentElement.lang = "de";

		expect(
			formatMetricTooltipTime(
				parseLocalDateTime("2026-01-01 00:00:00"),
				"yearly",
			),
		).toBe("2026");
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

	it("uses the English air-quality band label", () => {
		document.documentElement.lang = "en";

		expect(
			formatMetricTooltipValue(2.87, {
				kind: "timeSeries",
				decimals: 0,
				variant: "airQualityIndex",
			}),
		).toBe("3 · good");
	});
});
