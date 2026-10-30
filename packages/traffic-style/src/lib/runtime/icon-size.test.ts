import {expect, it} from "vitest";

import {mapsightRuntimeIconSize} from "./icon-size.ts";

it("returns physical dimensions synchronously before a bitmap is cached", () => {
	expect(
		mapsightRuntimeIconSize(
			"toilet-accessible/#fff/#123",
			"default",
			"width",
		),
	).toBe(128);
	expect(
		mapsightRuntimeIconSize("toilet-accessible", "default", "height"),
	).toBe(80);
	expect(mapsightRuntimeIconSize("toilet-accessible", "plain", "width")).toBe(
		108,
	);
	expect(mapsightRuntimeIconSize("toilet", "small", "width")).toBe(56);
});

it("keeps fallback and text-label dimensions square", () => {
	for (const id of [undefined, "", "unknown-poi", "WC", "AB", "P2"]) {
		expect(mapsightRuntimeIconSize(id, "default", "width")).toBe(80);
		expect(mapsightRuntimeIconSize(id, "default", "height")).toBe(80);
	}
});
