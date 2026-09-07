import {describe, expect, it} from "vitest";

import "../pictograms/index.ts";

import {uiIconSrc} from "./ui-icon-src.ts";

const SVG_DATA_URL_PREFIX = "data:image/svg+xml;charset=utf-8,";

function decodeSvgDataUrl(src: string): string {
	expect(src.startsWith(SVG_DATA_URL_PREFIX)).toBe(true);
	return decodeURIComponent(src.slice(SVG_DATA_URL_PREFIX.length));
}

describe("uiIconSrc", () => {
	it("returns a sync SVG data URL for a colored composable id", () => {
		const icon = uiIconSrc("museum/#be123c/#ffffff", "plain");

		expect(icon).not.toBeNull();
		expect(icon?.width).toBe(34);
		expect(icon?.height).toBe(34);

		const svg = decodeSvgDataUrl(icon?.src ?? "");
		expect(svg).toContain('viewBox="0 0 34 34"');
		expect(svg).toContain("#be123c");
		expect(svg).toContain("<svg");
	});

	it("uses the requested variant size", () => {
		const icon = uiIconSrc("museum", "default");

		expect(icon?.width).toBe(40);
		expect(icon?.height).toBe(40);
		expect(decodeSvgDataUrl(icon?.src ?? "")).toContain(
			'viewBox="0 0 40 40"',
		);
	});

	it("returns null for an empty id", () => {
		expect(uiIconSrc("")).toBeNull();
		expect(uiIconSrc("   ")).toBeNull();
	});

	it("is deterministic for the same id and variant", () => {
		expect(uiIconSrc("P2/#035799", "plain")?.src).toBe(
			uiIconSrc("P2/#035799", "plain")?.src,
		);
	});
});
