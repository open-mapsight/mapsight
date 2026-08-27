import {afterEach, describe, expect, it} from "vitest";

import {formatMetricDate} from "./format-metric-values.js";

const originalLang = document.documentElement.lang;

afterEach(() => {
	document.documentElement.lang = originalLang;
});

describe("formatMetricDate", () => {
	it("keeps the API calendar day for end-of-day lastDateTime", () => {
		document.documentElement.lang = "de";

		// parseLocalDateTime stores naive "Y-m-d H:i:s" as UTC components.
		expect(
			formatMetricDate(new Date(Date.UTC(2026, 7, 27, 23, 59, 59))),
		).toBe("27.08.2026");
	});
});
