import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import Polygon from "ol/geom/Polygon";

import * as sass from "sass";
import {expect, it} from "vitest";

import compile from "../src/js/index.ts";
import {loadStyleModule} from "./helpers/loadStyleModule.ts";

const trafficStyleScss = fileURLToPath(
	new URL("../../traffic-style/src/scss/", import.meta.url),
);

// A Simplestyle consumer: data colors override any state color, then the mixin emphasizes.
const scss = `
@use "mixins/polygon-interaction";

#features {
	stroke-width: 4;

	[state="select"] {
		stroke-color: #3afffe;
	}

	[stroke] {
		stroke-color: attr(stroke);
	}

	[prop|stroke-width] {
		stroke-width: attr("prop|stroke-width");
	}

	[fill] {
		fill-color: attr(fill);
	}

	@include polygon-interaction.polygonInteractionEmphasis;
}
`;

async function loadStyle() {
	const css = sass.compileString(scss, {loadPaths: [trafficStyleScss]}).css;
	return loadStyleModule(compile(css));
}

function district(state?: string) {
	return new Feature({
		geometry: new Polygon([
			[
				[0, 0],
				[0, 1],
				[1, 1],
				[0, 0],
			],
		]),
		stroke: "rgba(128,0,128,0.4)",
		"stroke-width": 2,
		fill: "rgba(255,255,255,0)",
		state,
	});
}

it("keeps polygon colors and widths unchanged without an interaction state", async () => {
	const style = await loadStyle();
	const [result] = style({style: "features"}, district());

	expect(result?.getStroke()?.getColor()).toBe("rgba(128,0,128,0.4)");
	expect(Number(result?.getStroke()?.getWidth())).toBe(2);
	expect(result?.getFill()?.getColor()).toBe("rgba(255,255,255,0)");
});

it.each([
	["highlight", 4, [128, 0, 128, 0.85], [255, 255, 255, 0.18]],
	["select", 6, [128, 0, 128, 1], [255, 255, 255, 0.3]],
])(
	"emphasizes %s polygons while preserving data colors",
	async (state, width, stroke, fill) => {
		const style = await loadStyle();
		const [result] = style({style: "features"}, district(state));

		expect(result?.getStroke()?.getWidth()).toBe(width);
		expect(result?.getStroke()?.getColor()).toEqual(stroke);
		expect(result?.getFill()?.getColor()).toEqual(fill);
	},
);

it("restores the unemphasized style after deselection", async () => {
	const style = await loadStyle();
	const feature = district("select");
	style({style: "features"}, feature);
	feature.unset("state");
	const [result] = style({style: "features"}, feature);

	expect(Number(result?.getStroke()?.getWidth())).toBe(2);
	expect(result?.getFill()?.getColor()).toBe("rgba(255,255,255,0)");
});

it("leaves other geometry types to the regular state styles", async () => {
	const style = await loadStyle();
	const line = new Feature({
		geometry: new LineString([
			[0, 0],
			[1, 1],
		]),
		state: "select",
	});
	const [result] = style({style: "features"}, line);

	expect(result?.getStroke()?.getColor()).toBe("#3afffe");
	expect(Number(result?.getStroke()?.getWidth())).toBe(4);
});

it("applies the README interaction example to a transparent selected fill", async () => {
	const readme = readFileSync(
		new URL("../README.md", import.meta.url),
		"utf8",
	);
	const example = readme.match(
		/### Interaction emphasis[\s\S]*?```scss\n([\s\S]*?)```/,
	)?.[1];
	expect(example).toBeDefined();
	const style = await loadStyleModule(
		compile(sass.compileString(example ?? "").css),
	);
	const feature = district("select");
	const [result] = style({style: "features"}, feature);

	expect(result?.getStroke()?.getWidth()).toBe(5);
	expect(result?.getFill()?.getColor()).toEqual([255, 255, 255, 0.3]);
});
