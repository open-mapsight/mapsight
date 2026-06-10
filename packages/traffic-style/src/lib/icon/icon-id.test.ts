import {describe, expect, it} from "vitest";

import {
	formatMapsightIcon,
	parseMapsightIcon,
	resolveMapsightIconSpec,
} from "./icon-id.ts";

describe("parseMapsightIcon", () => {
	it("uses default colors for icon id only", () => {
		expect(parseMapsightIcon("museum")).toEqual({
			pictogram: "museum",
		});
	});

	it("parses background with auto foreground", () => {
		expect(parseMapsightIcon("museum/#be123c")).toEqual({
			pictogram: "museum",
			colors: {background: "#be123c", foreground: "#ffffff"},
		});
	});

	it("parses explicit foreground", () => {
		expect(parseMapsightIcon("museum/#be123c/#ffffff")).toEqual({
			pictogram: "museum",
			colors: {background: "#be123c", foreground: "#ffffff"},
		});
	});

	it("supports short text labels", () => {
		expect(parseMapsightIcon("P2/#035799")).toEqual({
			label: "P2",
			colors: {background: "#035799", foreground: "#ffffff"},
		});
	});

	it("classifies single-letter and single-digit ids as labels", () => {
		expect(parseMapsightIcon("a")).toEqual({label: "A"});
		expect(parseMapsightIcon("7")).toEqual({label: "7"});
	});

	it("formats compact values", () => {
		expect(
			formatMapsightIcon({
				pictogram: "museum",
				colors: {background: "#be123c", foreground: "#ffffff"},
			}),
		).toBe("museum/#be123c");
		expect(
			formatMapsightIcon({
				pictogram: "museum",
				colors: {background: "#ffffff", foreground: "#000000"},
			}),
		).toBe("museum");
	});
});

describe("resolveMapsightIconSpec", () => {
	it("parses compact ids with colors", () => {
		expect(resolveMapsightIconSpec("museum/#be123c")).toEqual({
			pictogram: "museum",
			colors: {background: "#be123c", foreground: "#ffffff"},
		});
	});

	it("applies variant", () => {
		expect(resolveMapsightIconSpec("museum", "plain")).toEqual({
			pictogram: "museum",
			variant: "plain",
		});
	});

	it("falls back unknown pictograms to the default icon", () => {
		expect(resolveMapsightIconSpec("unknown-poi")).toEqual({
			pictogram: "marker",
		});
	});
});
