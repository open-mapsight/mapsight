import "../pictograms/fontawesome.ts";

import {expect, it} from "vitest";

import {mapsightRuntimeIconSize} from "./icon-size.ts";

it("returns physical dimensions synchronously before a bitmap is cached", () => {
	expect(
		mapsightRuntimeIconSize(
			"fa-restroom+fa-wheelchair/#fff/#123",
			"default",
			"width",
		),
	).toBe(128);
	expect(
		mapsightRuntimeIconSize(
			"fa-restroom+fa-wheelchair",
			"default",
			"height",
		),
	).toBe(80);
	expect(
		mapsightRuntimeIconSize("fa-restroom+fa-wheelchair", "plain", "width"),
	).toBe(108);
	expect(mapsightRuntimeIconSize("fa-restroom", "small", "width")).toBe(56);
});

it("keeps fallback and text-label dimensions square", () => {
	for (const id of [undefined, "", "unknown-poi", "WC", "AB", "P2"]) {
		expect(mapsightRuntimeIconSize(id, "default", "width")).toBe(80);
		expect(mapsightRuntimeIconSize(id, "default", "height")).toBe(80);
	}
});
