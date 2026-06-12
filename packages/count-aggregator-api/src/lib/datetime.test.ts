import {describe, expect, it} from "vitest";

import {parseLocalDateTime} from "./datetime.js";

describe("parseLocalDateTime", () => {
	it("parses API local datetime strings as UTC components", () => {
		const date = parseLocalDateTime("2026-06-08 14:30:00");
		expect(date.getUTCFullYear()).toBe(2026);
		expect(date.getUTCMonth()).toBe(5);
		expect(date.getUTCDate()).toBe(8);
		expect(date.getUTCHours()).toBe(14);
		expect(date.getUTCMinutes()).toBe(30);
	});
});
