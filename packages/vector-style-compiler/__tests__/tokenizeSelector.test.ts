import {describe, expect, it} from "vitest";

import tokenizeSelector, {
	splitAttributeSelectorContent,
} from "../src/js/helpers/tokenizeSelector.ts";

describe("tokenizeSelector", () => {
	it("tokenizes attribute selectors with bracket notation inside quoted |js values", () => {
		expect(
			tokenizeSelector(
				"[|js=\"props['stroke-width'] == 3\"] .group #features",
			),
		).toEqual([
			"[|js=\"props['stroke-width'] == 3\"]",
			".group",
			"#features",
		]);
	});

	it("tokenizes quoted attribute names", () => {
		expect(tokenizeSelector("['stroke-width'=\"3\"]")).toEqual([
			"['stroke-width'=\"3\"]",
		]);
	});

	it("tokenizes prop-prefixed attribute selectors", () => {
		expect(tokenizeSelector('[prop|stroke-width="3"]')).toEqual([
			'[prop|stroke-width="3"]',
		]);
	});

	it("tokenizes :not() with nested attribute selectors", () => {
		expect(tokenizeSelector(':not( [attr   =  "test"]   ) .group')).toEqual(
			[':not( [attr   =  "test"]   )', ".group"],
		);
	});

	it("tokenizes attribute values ending with an escaped backslash", () => {
		expect(tokenizeSelector('[attr="test\\\\"]')).toEqual([
			'[attr="test\\\\"]',
		]);
	});

	it("tokenizes attribute values containing escaped quotes", () => {
		expect(tokenizeSelector('[attr="say \\"hello\\""]')).toEqual([
			'[attr="say \\"hello\\""]',
		]);
	});

	it("tokenizes :not() with attribute values ending in an escaped backslash", () => {
		expect(tokenizeSelector(':not([attr="path\\\\"]) .group')).toEqual([
			':not([attr="path\\\\"])',
			".group",
		]);
	});
});

describe("splitAttributeSelectorContent", () => {
	it("splits on the first unquoted equals sign", () => {
		expect(
			splitAttributeSelectorContent("|js=\"props['stroke-width'] == 3\""),
		).toEqual(["|js", "\"props['stroke-width'] == 3\""]);
	});

	it("splits when the value ends with an escaped backslash", () => {
		expect(splitAttributeSelectorContent('attr="test\\\\"')).toEqual([
			"attr",
			'"test\\\\"',
		]);
	});

	it("splits when the value contains escaped quotes", () => {
		expect(splitAttributeSelectorContent('attr="say \\"hello\\""')).toEqual(
			["attr", '"say \\"hello\\""'],
		);
	});
});
