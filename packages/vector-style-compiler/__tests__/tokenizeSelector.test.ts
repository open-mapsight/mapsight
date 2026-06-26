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
});

describe("splitAttributeSelectorContent", () => {
	it("splits on the first unquoted equals sign", () => {
		expect(
			splitAttributeSelectorContent("|js=\"props['stroke-width'] == 3\""),
		).toEqual(["|js", "\"props['stroke-width'] == 3\""]);
	});
});
