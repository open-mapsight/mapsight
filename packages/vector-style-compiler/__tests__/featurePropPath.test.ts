import Feature from "ol/Feature";
import Point from "ol/geom/Point";

import * as sass from "sass";
import {describe, expect, it} from "vitest";

import compile from "../src/js/index.ts";
import {loadStyleModule} from "./helpers/loadStyleModule.ts";

const props = {stroke: {width: 2}, "stroke-width": 5};
const env = {stroke: {width: 3}, "stroke-width": 7};

function scss(source: string) {
	return sass.compileString(source).css;
}

describe("feature paths through Sass, compilation and OpenLayers", () => {
	it.each([
		["stroke-width", 2],
		["'stroke-width'", 5],
		['"stroke-width"', 5],
		['"prop|stroke-width"', 5],
		["--env-stroke-width", 3],
		["--env-'stroke-width'", 7],
		['"env-prop|stroke-width"', 7],
	] as const)(
		"resolves attr(%s) without confusing literal and nested paths",
		async (argument, expected) => {
			const style = await loadStyleModule(
				compile(
					scss(`* { stroke-width: calc(1 * attr(${argument})); }`),
				),
			);
			const feature = new Feature({
				geometry: new Point([0, 0]),
				...props,
			});
			expect(
				Number(style(env, feature)[0]?.getStroke()?.getWidth()),
			).toBe(expected);
		},
	);

	it.each(["prop|stroke-width", "env-prop|stroke-width"])(
		"also accepts unquoted %s in plain CSS",
		async (argument) => {
			const style = await loadStyleModule(
				compile(`* { stroke-width: calc(1 * attr(${argument})); }`),
			);
			const feature = new Feature({
				geometry: new Point([0, 0]),
				...props,
			});
			expect(
				Number(style(env, feature)[0]?.getStroke()?.getWidth()),
			).toBe(argument.startsWith("env-") ? 7 : 5);
		},
	);

	it.each([
		'[stroke-width="2"]',
		'[#{"stroke-width"}="2"]',
		'[prop|stroke-width="5"]',
		'[env-prop|stroke-width="7"]',
		"[prop|stroke-width] [|js=\"props['stroke-width'] == 5\"]",
	])(
		"evaluates %s and invalidates a cached match when its input changes",
		async (selector) => {
			const style = await loadStyleModule(
				compile(
					scss(`
			* { stroke-color: gray; }
			${selector} { stroke-color: red; }
		`),
				),
			);
			const feature = new Feature({
				geometry: new Point([0, 0]),
				...props,
			});
			expect(style(env, feature)[0]?.getStroke()?.getColor()).toBe("red");
			feature.setProperties({stroke: {width: 9}, "stroke-width": 9});
			expect(
				style({stroke: {width: 9}, "stroke-width": 9}, feature)[0]
					?.getStroke()
					?.getColor(),
			).toBe("gray");
		},
	);

	it("accepts quoted selector keys in plain CSS", async () => {
		const style = await loadStyleModule(
			compile(`['stroke-width'="5"] { stroke-color: red; }`),
		);
		const feature = new Feature({geometry: new Point([0, 0]), ...props});
		expect(style({}, feature)[0]?.getStroke()?.getColor()).toBe("red");
	});

	it.each([`['stroke-width'="5"]`, `[env|prop|stroke-width="7"]`])(
		"rejects %s at the Sass boundary",
		(selector) => {
			expect(() => scss(`${selector} { stroke-color: red; }`)).toThrow();
		},
	);
});
