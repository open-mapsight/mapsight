import {describe, expect, it} from "vitest";

import {applyPresetDateRanges} from "../config/platform.js";
import {dateToYmd, formatChartAxisDate, ymdToDate} from "./dates.js";

describe("dates", () => {
	it("round-trips ymd dates", () => {
		const date = new Date(2024, 5, 15);
		expect(dateToYmd(date)).toBe("2024-06-15");
		expect(dateToYmd(ymdToDate("2024-06-15"))).toBe("2024-06-15");
	});
});

describe("applyPresetDateRanges", () => {
	it("finds min and max from day ranges", () => {
		const start = new Date(2024, 0, 1);
		const end = new Date(2024, 2, 1);

		const result = applyPresetDateRanges([
			{type: "day", date: end},
			{type: "day", date: start},
		]);

		expect(result.startDate).toEqual(start);
		expect(result.endDate).toEqual(end);
	});
});

describe("formatChartAxisDate", () => {
	const tick = new Date(2026, 9, 2, 8, 30);
	it.each(["5min", "15min", "hourly"] as const)(
		"includes date and time for a multi-day %s range",
		(resolution) => {
			expect(
				formatChartAxisDate(tick.getTime(), resolution, {
					startDate: new Date(2026, 9, 1),
					endDate: new Date(2026, 9, 8),
				}),
			).toBe(
				tick.toLocaleString(undefined, {
					day: "numeric",
					month: "short",
					hour: "2-digit",
					minute: "2-digit",
				}),
			);
		},
	);
	it("uses dates even for a short range crossing midnight", () => {
		const label = formatChartAxisDate(tick.getTime(), "hourly", {
			startDate: new Date(2026, 9, 1, 23),
			endDate: tick,
		});
		expect(label).toContain(
			tick.toLocaleDateString(undefined, {month: "short"}),
		);
	});
	it("preserves time-only labels for a single day and callers without a range", () => {
		const expected = tick.toLocaleTimeString(undefined, {
			hour: "2-digit",
			minute: "2-digit",
		});
		expect(
			formatChartAxisDate(tick.getTime(), "hourly", {
				startDate: new Date(2026, 9, 2),
				endDate: tick,
			}),
		).toBe(expected);
		expect(formatChartAxisDate(tick.getTime(), "hourly")).toBe(expected);
	});
	it("includes the year when the range crosses a year boundary", () => {
		expect(
			formatChartAxisDate(tick.getTime(), "hourly", {
				startDate: new Date(2025, 11, 31),
				endDate: tick,
			}),
		).toBe(
			tick.toLocaleString(undefined, {
				day: "numeric",
				month: "short",
				year: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
			}),
		);
	});
	it.each(["daily", "weekly", "monthly", "yearly"] as const)(
		"preserves existing %s labels",
		(resolution) => {
			expect(
				formatChartAxisDate(tick.getTime(), resolution, {
					startDate: new Date(2026, 9, 1),
					endDate: tick,
				}),
			).toBe(formatChartAxisDate(tick.getTime(), resolution));
		},
	);
});
