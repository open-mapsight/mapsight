import {describe, expect, it} from "vitest";

import type {Station} from "../types";
import {formatStationLabel} from "./stations.js";

function createStation(overrides: Partial<Station>): Station {
	return {
		id: 1,
		originId: "fallback-id",
		label: "Station",
		typeName: "Bicycle",
		status: null,
		...overrides,
	};
}

describe("formatStationLabel", () => {
	it("trims trailing metric suffixes", () => {
		expect(
			formatStationLabel(createStation({label: "Main Street (total)"})),
		).toBe("Main Street");
	});

	it("preserves parenthesized text without a preceding space", () => {
		expect(
			formatStationLabel(createStation({label: "Main Street(total)"})),
		).toBe("Main Street(total)");
	});

	it("preserves non-trailing parenthesized text", () => {
		expect(
			formatStationLabel(
				createStation({label: "Main Street (north) counter"}),
			),
		).toBe("Main Street (north) counter");
	});

	it("falls back to the origin id when the display label is empty", () => {
		expect(formatStationLabel(createStation({label: " (total)"}))).toBe(
			"fallback-id",
		);
		expect(formatStationLabel(createStation({label: null}))).toBe(
			"fallback-id",
		);
	});
});
