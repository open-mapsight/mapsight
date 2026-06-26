import {describe, expect, it} from "vitest";

import parseAttrParameter from "../src/js/helpers/parseAttrParameter.ts";

describe("parseAttrParameter", () => {
	it("parses nested and literal prop paths", () => {
		expect(parseAttrParameter("stroke-width")).toEqual({
			target: "props",
			path: ["stroke", "width"],
		});
		expect(parseAttrParameter("prop|stroke-width")).toEqual({
			target: "props",
			path: ["stroke-width"],
		});
		expect(parseAttrParameter("'stroke-width'")).toEqual({
			target: "props",
			path: ["stroke-width"],
		});
	});

	it("parses nested and literal env paths", () => {
		expect(parseAttrParameter("--env-stroke-width")).toEqual({
			target: "env",
			path: ["stroke", "width"],
		});
		expect(parseAttrParameter("--env-'stroke-width'")).toEqual({
			target: "env",
			path: ["stroke-width"],
		});
		expect(parseAttrParameter("env-prop|stroke-width")).toEqual({
			target: "env",
			path: ["stroke-width"],
		});
	});

	it("parses quoted prop-prefixed arguments", () => {
		expect(parseAttrParameter('"prop|stroke-width"')).toEqual({
			target: "props",
			path: ["stroke-width"],
		});
		expect(parseAttrParameter('"env-prop|stroke-width"')).toEqual({
			target: "env",
			path: ["stroke-width"],
		});
	});
});
