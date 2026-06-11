import {describe, expect, it} from "vitest";

import {
	extractSvgParts,
	normalizePictogramColor,
	normalizePictogramMarkup,
} from "./import-pictograms.ts";

describe("normalizePictogramColor", () => {
	it("maps dark export colors to currentColor", () => {
		expect(normalizePictogramColor("#000")).toBe("currentColor");
		expect(normalizePictogramColor("#010101")).toBe("currentColor");
		expect(normalizePictogramColor("#241f20")).toBe("currentColor");
	});

	it("keeps white as fixed inline accent", () => {
		expect(normalizePictogramColor("#fff")).toBe("#ffffff");
		expect(normalizePictogramColor("#ffffff")).toBe("#ffffff");
	});

	it("passes through other colors unchanged", () => {
		expect(normalizePictogramColor("#035799")).toBe("#035799");
	});
});

describe("normalizePictogramMarkup", () => {
	it("rewrites fill and stroke on paths", () => {
		const markup =
			'<path fill="#000" stroke="#fff" d="M0 0"/><path stroke="#000" d="M1 1"/>';
		expect(normalizePictogramMarkup(markup)).toContain(
			'fill="currentColor"',
		);
		expect(normalizePictogramMarkup(markup)).toContain('stroke="#ffffff"');
		expect(normalizePictogramMarkup(markup)).toContain(
			'stroke="currentColor"',
		);
	});

	it("adds currentColor fill to implicit filled paths", () => {
		const markup = '<path fill-rule="evenodd" d="M3 6.689 12 3"/>';
		expect(normalizePictogramMarkup(markup)).toContain(
			'fill="currentColor"',
		);
	});
});

describe("extractSvgParts", () => {
	it("extracts viewBox and inner markup", () => {
		const {viewBox, markup} = extractSvgParts(
			'<svg viewBox="0 0 24 24"><path fill="#000" d="M1 1"/></svg>',
		);
		expect(viewBox).toBe("0 0 24 24");
		expect(markup).toContain('fill="currentColor"');
	});
});
