import {describe, expect, it} from "vitest";

import {
	parseFeaturePropPath,
	parsePropPathSegment,
} from "../src/js/helpers/parseFeaturePropPath.ts";

describe("parsePropPathSegment", () => {
	it("splits unquoted kebab-case into nested path segments", () => {
		expect(parsePropPathSegment("stroke-width")).toEqual([
			"stroke",
			"width",
		]);
	});

	it("preserves hyphens in quoted literal keys", () => {
		expect(parsePropPathSegment("'stroke-width'")).toEqual([
			"stroke-width",
		]);
	});
});

describe("parseFeaturePropPath", () => {
	it("parses selector attribute names", () => {
		expect(parseFeaturePropPath("stroke-width", "selector")).toEqual({
			target: "props",
			path: ["stroke", "width"],
		});
		expect(parseFeaturePropPath("prop|stroke-width", "selector")).toEqual({
			target: "props",
			path: ["stroke-width"],
		});
		expect(
			parseFeaturePropPath("env-prop|stroke-width", "selector"),
		).toEqual({
			target: "env",
			path: ["stroke-width"],
		});
	});

	it("parses attr arguments", () => {
		expect(parseFeaturePropPath("--env-stroke-width", "attr")).toEqual({
			target: "env",
			path: ["stroke", "width"],
		});
		expect(parseFeaturePropPath("prop|stroke-width", "attr")).toEqual({
			target: "props",
			path: ["stroke-width"],
		});
	});
});
