import {describe, expect, it} from "vitest";

import {unique, uniqueCrs} from "../util";

describe("unique", () => {
	it("keeps the first occurrence and compares exactly", () => {
		expect(unique(["Default", "default", "Default", "a", "a"])).toEqual([
			"Default",
			"default",
			"a",
		]);
	});
});

describe("uniqueCrs", () => {
	it("ignores the case of CRS codes and keeps the first spelling", () => {
		expect(
			uniqueCrs(["epsg:3857", "EPSG:4326", "EPSG:3857", "epsg:4326"]),
		).toEqual(["epsg:3857", "EPSG:4326"]);
	});
});
