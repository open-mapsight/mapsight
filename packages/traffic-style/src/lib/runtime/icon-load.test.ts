import {describe, expect, it} from "vitest";

import {getCachedIcon, loadIcon} from "./icon-load.ts";

describe("getCachedIcon", () => {
	it("returns undefined for invalid compact ids", () => {
		expect(getCachedIcon("")).toBeUndefined();
		expect(getCachedIcon("   ")).toBeUndefined();
	});
});

describe("loadIcon", () => {
	it("returns null for invalid compact ids", async () => {
		await expect(loadIcon("")).resolves.toBeNull();
	});
});
