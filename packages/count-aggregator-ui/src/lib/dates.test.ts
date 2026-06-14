import {describe, expect, it} from "vitest";

import {applyPresetDateRanges} from "../config/platform.js";
import {dateToYmd, ymdToDate} from "./dates.js";

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
