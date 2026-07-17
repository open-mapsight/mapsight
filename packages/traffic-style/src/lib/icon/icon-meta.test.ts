import {describe, expect, it} from "vitest";

import {
	getIconLabel,
	hasIcon,
	listComposableIconIds,
	listIconIds,
	listSpriteIconIds,
} from "../icon-meta.ts";

describe("icon-meta lists", () => {
	it("lists catalog ids from meta.json", () => {
		const all = listIconIds();
		expect(all.length).toBeGreaterThan(10);
		expect(all).toContain("marker");
		expect(all).toEqual([...all].sort());
	});

	it("splits composable and sprite ids", () => {
		const composable = listComposableIconIds();
		const sprite = listSpriteIconIds();

		expect(composable).toContain("marker");
		expect(composable).toContain("fa-bolt");
		expect(composable).toContain("p");
		expect(sprite).not.toContain("marker");
		expect(new Set([...composable, ...sprite]).size).toBe(
			listIconIds().length,
		);
	});

	it("resolves labels and membership", () => {
		expect(hasIcon("marker")).toBe(true);
		expect(hasIcon("marker/#000000")).toBe(true);
		expect(hasIcon("not-a-real-icon")).toBe(false);
		expect(getIconLabel("marker", "de")).toBe("Markierung");
		expect(getIconLabel("marker", "en")).toBe("Marker");
	});
});
