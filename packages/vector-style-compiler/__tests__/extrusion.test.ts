import {readFileSync} from "node:fs";

import Feature from "ol/Feature";
import type Geometry from "ol/geom/Geometry";
import MultiPolygon from "ol/geom/MultiPolygon";
import Polygon from "ol/geom/Polygon";
import BuilderGroup from "ol/render/canvas/BuilderGroup";
import ExecutorGroup from "ol/render/canvas/ExecutorGroup";
import {renderFeature} from "ol/renderer/vector";
import Fill from "ol/style/Fill";
import Style from "ol/style/Style";

import {createCanvas} from "canvas";
import * as sass from "sass";
import {expect, it} from "vitest";

import createCachedStyleFunction from "../../lib-ol/src/js/style/createCachedStyleFunction.ts";
import compile from "../src/js/index.ts";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const example = readme.match(
	/### Derived geometries[\s\S]*?```scss\n([\s\S]*?)```/,
)?.[1];
if (!example) {
	throw new Error("Missing extrusion example in the README");
}

function compileStyle(scss: string) {
	const program = compile(sass.compileString(scss).css, {
		template: ({__meta, program1, program2}) => `
			const createHash = JSON.stringify;
			return createCachedStyleFunction({
				constructorsMap: {fill: Fill, style: Style},
				allowedProps: ${JSON.stringify(__meta.styleProps)},
				declarationHashFunction: (env, props, hashPrefix, geometryType, style) => {
					const hash = [hashPrefix, geometryType];
					const h = (value) => hash.push(value);
					${program1}
					return hash.join('|');
				},
				declarationFunction: (env, props, geometryType, style) => {
					const d = {};
					${program2}
					return d;
				},
			});`,
	});
	// Execute the compiler's declaration and cache programs against the real runtime.
	// eslint-disable-next-line @typescript-eslint/no-implied-eval
	const execute = new Function(
		"createCachedStyleFunction",
		"Fill",
		"Style",
		program,
	) as (
		createStyle: typeof createCachedStyleFunction,
		fill: typeof Fill,
		style: typeof Style,
	) => ReturnType<typeof createCachedStyleFunction>;
	return execute(createCachedStyleFunction, Fill, Style);
}

const documentedStyle = compileStyle(example);

function stall(geometry: Geometry) {
	const feature = new Feature(geometry);
	feature.setProperties({kind: "stall", fill: "#ff0000"});
	return feature;
}

function render(features: Array<Feature>) {
	const canvas = createCanvas(256, 256);
	const context = canvas.getContext("2d");
	const builders = new BuilderGroup(0, [-1, -1, 12, 12], 0.05, 1);
	for (const feature of features) {
		for (const style of documentedStyle({}, feature) as Style[]) {
			renderFeature(builders, feature, style, 0, () => {});
		}
	}
	const executor = new ExecutorGroup(null, 0.05, 1, true, builders.finish());
	// node-canvas implements the Canvas 2D operations used by OL's polygon renderer.
	executor.execute(
		context as unknown as CanvasRenderingContext2D,
		[256, 256],
		[20, 0, 0, -20, 20, 236],
		0,
		true,
	);
	return (x: number, y: number) =>
		Array.from(
			context.getImageData(
				Math.round(20 + 20 * x),
				Math.round(236 - 20 * y),
				1,
				1,
			).data,
		);
}

const square = (y: number, size: number) => [
	[0, y],
	[size, y],
	[size, y + size],
	[0, y + size],
	[0, y],
];

it("draws the lit wall of a rotated stall with the documented stylesheet", () => {
	const polygon = new Polygon([square(0, 1)]);
	polygon.rotate(Math.PI / 9, [0, 0]);
	expect(render([stall(polygon)])(-0.17, 1.07)).toEqual([255, 0, 0, 255]);
});

it("keeps a concave roof above rear walls and their tint", () => {
	const polygon = new Polygon([
		[
			[0, 0],
			[1, 0],
			[1, 0.4],
			[0.4, 0.4],
			[0.4, 0.6],
			[1, 0.6],
			[1, 1],
			[0, 1],
			[0, 0],
		],
	]);
	expect(render([stall(polygon)])(0.7, 1.4)).toEqual([255, 0, 0, 255]);
});

it("keeps MultiPolygon roofs above rear walls", () => {
	const polygon = new MultiPolygon([[square(0, 0.4)], [square(0.6, 0.4)]]);
	expect(render([stall(polygon)])(0.2, 1.4)).toEqual([255, 0, 0, 255]);
});

it.each([false, true])(
	"orders roofs across features, reversed insertion=%s",
	(reverse) => {
		const features = [
			stall(new Polygon([square(0, 3)])),
			stall(new Polygon([square(3, 3)])),
		];
		expect(
			render(reverse ? features.reverse() : features)(1.5, 3.6),
		).toEqual([255, 0, 0, 255]);
	},
);

it("draws a courtyard's inner wall while leaving the opening transparent", () => {
	const polygon = new Polygon([
		square(0, 10),
		[
			[3, 3],
			[3, 7],
			[7, 7],
			[7, 3],
			[3, 3],
		],
	]);
	const pixel = render([stall(polygon)]);
	expect(pixel(5, 7.5)).toEqual([153, 0, 0, 255]);
	expect(pixel(5, 5)).toEqual([0, 0, 0, 0]);
});

it.each([undefined, "undefined", "not-a-height", "Infinity", -1, 0, "1.2"])(
	"handles compiled attr() height %s without corrupting the feature",
	(height) => {
		const style = compileStyle(`
			* { geometry: extrusionRoof; extrusion-height: attr(height); fill-color: red; }
			.walls { geometry: extrusionShadedWalls; extrusion-height: attr(height); fill-color: red; }
		`);
		const polygon = new Polygon([square(0, 1)]);
		const feature = stall(polygon);
		if (height !== undefined) feature.set("height", height);
		const styles = style({}, feature) as Style[];
		const roof = styles[0]!.getGeometry() as Polygon;
		expect(roof.getFlatCoordinates().every(Number.isFinite)).toBe(true);
		if (height === "1.2") {
			expect(roof.getCoordinates()[0]![0]).toEqual([0, 1.2]);
			expect(styles).toHaveLength(2);
		} else {
			expect(roof).toBe(polygon);
			expect(styles).toHaveLength(1);
		}
	},
);
