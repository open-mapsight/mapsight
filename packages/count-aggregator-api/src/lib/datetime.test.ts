import {describe, expect, it} from "vitest";

import type {TimeSeriesResponse} from "../types.js";
import {
	LOCAL_DATE_TIME_PATTERN,
	assertLocalDateTimeFields,
	parseLocalDateTime,
} from "./datetime.js";

describe("parseLocalDateTime", () => {
	it("parses API local datetime strings as UTC components", () => {
		const date = parseLocalDateTime("2026-06-08 14:30:00");
		expect(date.getUTCFullYear()).toBe(2026);
		expect(date.getUTCMonth()).toBe(5);
		expect(date.getUTCDate()).toBe(8);
		expect(date.getUTCHours()).toBe(14);
		expect(date.getUTCMinutes()).toBe(30);
	});

	it("uses the shared local datetime pattern for response validation", () => {
		const series: TimeSeriesResponse = {
			id: 150,
			stationId: "138969",
			fromDateTime: "2026-06-08 14:30:00",
			toDateTime: "2026-06-08 15:30:00",
			lastDateTime: "2026-06-08 15:30:00",
			resolution: "hourly",
			values: [{datetime: "2026-06-08 15:00:00", value: 12}],
		};

		expect(LOCAL_DATE_TIME_PATTERN.test(series.fromDateTime)).toBe(true);
		expect(() => assertLocalDateTimeFields(series)).not.toThrow();
		expect(() =>
			assertLocalDateTimeFields({
				...series,
				values: [{datetime: "2026-06-08T15:00:00Z", value: 12}],
			}),
		).toThrow(/values\[\]\.datetime/);
	});
});
