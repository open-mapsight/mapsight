import {expect, it} from "vitest";

import {declarationToExtrusionHeight} from "./declarationToGeometry.ts";

it.each([
	[1.2, 1.2],
	["1.2", 1.2],
	[0, 0],
	["0", 0],
	["undefined", undefined],
	["2,5", undefined],
	["1.2m", undefined],
	["Infinity", undefined],
	[NaN, undefined],
	[Infinity, undefined],
])("parses extrusion height %s as %s", (value, expected) => {
	expect(declarationToExtrusionHeight({extrusion: {height: {value}}})).toBe(
		expected,
	);
});

it("leaves absent extrusion heights at the default", () => {
	expect(declarationToExtrusionHeight()).toBeUndefined();
	expect(declarationToExtrusionHeight({})).toBeUndefined();
});
