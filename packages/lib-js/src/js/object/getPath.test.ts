import {describe, expect, it} from "vitest";

import getPath from "./getPath.ts";

describe("getPath", () => {
	it("resolves nested paths", () => {
		expect(getPath({a: [{b: {c: 3}}]}, ["a", 0, "b", "c"])).toBe(3);
	});

	it("returns defaultValue when the final key is missing", () => {
		expect(
			getPath(
				{properties: {name: "x"}},
				["properties", "overrideListHtml"],
				"fallback",
			),
		).toBe("fallback");
	});

	it("returns defaultValue when a middle segment is missing", () => {
		expect(getPath({a: 1}, ["a", "b", "c"], "fallback")).toBe("fallback");
	});

	it("returns defaultValue for nullish roots", () => {
		expect(getPath(null, ["a"], "fallback")).toBe("fallback");
		expect(getPath(undefined, ["a"], "fallback")).toBe("fallback");
	});

	it("returns defaultValue when the resolved value is explicitly undefined", () => {
		expect(
			getPath(
				{properties: {x: undefined}},
				["properties", "x"],
				"fallback",
			),
		).toBe("fallback");
	});

	it("returns null when the resolved value is null (null is not undefined)", () => {
		expect(
			getPath({properties: {x: null}}, ["properties", "x"], "fallback"),
		).toBe(null);
	});
});
