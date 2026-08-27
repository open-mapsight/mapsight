import {describe, expect, it} from "vitest";

import {
	formatWindDirection,
	normalizeWindDegrees,
	windDirectionCardinal,
} from "./wind-direction.js";

describe("wind direction helpers", () => {
	it("normalizes degrees into 0–360", () => {
		expect(normalizeWindDegrees(0)).toBe(0);
		expect(normalizeWindDegrees(370)).toBe(10);
		expect(normalizeWindDegrees(-45)).toBe(315);
	});

	it("maps degrees to cardinal labels", () => {
		expect(windDirectionCardinal(0, "de")).toBe("N");
		expect(windDirectionCardinal(90, "de")).toBe("O");
		expect(windDirectionCardinal(90, "en")).toBe("E");
		expect(windDirectionCardinal(225, "de")).toBe("SW");
	});

	it("formats citizen-facing wind strings", () => {
		expect(formatWindDirection(45, "de")).toBe("NO (45°)");
		expect(formatWindDirection(180, "en")).toBe("S (180°)");
	});
});
