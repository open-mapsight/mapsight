import type {Coordinate} from "ol/coordinate";
import MultiPolygon from "ol/geom/MultiPolygon";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";

import {describe, expect, it} from "vitest";

import deriveGeometriesFromBase from "./deriveGeometriesFromBase.ts";
import extrudeGeometry, {extrudeRings} from "./extrusion.ts";

// Counter-clockwise unit square: south, east, north and west edge.
const square: Array<Coordinate> = [
	[0, 0],
	[1, 0],
	[1, 1],
	[0, 1],
	[0, 0],
];

describe("extrudeRings", () => {
	it("moves the roof north and draws the south, east and west walls", () => {
		const {roof, litWalls, shadedWalls} = extrudeRings([square], 2);

		expect(roof).toEqual([
			[
				[0, 2],
				[1, 2],
				[1, 3],
				[0, 3],
				[0, 2],
			],
		]);
		// Light from the north-west: the west wall is lit.
		expect(litWalls).toEqual([
			[
				[
					[0, 1],
					[0, 0],
					[0, 2],
					[0, 3],
					[0, 1],
				],
			],
		]);
		// South and east walls are shaded; the north wall hides under the roof.
		expect(shadedWalls).toEqual([
			[
				[
					[0, 0],
					[1, 0],
					[1, 2],
					[0, 2],
					[0, 0],
				],
			],
			[
				[
					[1, 0],
					[1, 1],
					[1, 3],
					[1, 2],
					[1, 0],
				],
			],
		]);
	});

	it("finds the same walls on clockwise rings", () => {
		const clockwise = extrudeRings([[...square].reverse()], 2);

		expect(clockwise.litWalls).toHaveLength(1);
		expect(clockwise.shadedWalls).toHaveLength(2);
	});

	it("lifts holes with the roof", () => {
		const hole: Array<Coordinate> = [
			[0.25, 0.25],
			[0.25, 0.75],
			[0.75, 0.75],
			[0.25, 0.25],
		];

		expect(extrudeRings([square, hole], 1).roof[1]).toEqual([
			[0.25, 1.25],
			[0.25, 1.75],
			[0.75, 1.75],
			[0.25, 1.25],
		]);
	});
});

describe("extrudeGeometry", () => {
	it("keeps the roof's geometry type and joins walls into a MultiPolygon", () => {
		const polygon = new Polygon([square]);
		const multiPolygon = new MultiPolygon([
			[square],
			[square.map(([x, y]): Coordinate => [x! + 2, y!])],
		]);

		expect(extrudeGeometry(polygon, 1, "roof")).toBeInstanceOf(Polygon);
		expect(extrudeGeometry(multiPolygon, 1, "roof")).toBeInstanceOf(
			MultiPolygon,
		);
		expect(
			(extrudeGeometry(multiPolygon, 1, "shadedWalls") as MultiPolygon)
				.getPolygons()
				.map((wall) => wall.getCoordinates()[0]![0]),
		).toEqual([
			[0, 0],
			[1, 0],
			[2, 0],
			[3, 0],
		]);
	});

	it("reuses derived geometries until the source changes", () => {
		const polygon = new Polygon([square]);
		const roof = extrudeGeometry(polygon, 1, "roof");

		expect(extrudeGeometry(polygon, 1, "roof")).toBe(roof);
		expect(extrudeGeometry(polygon, 2, "roof")).not.toBe(roof);

		polygon.translate(1, 0);

		expect(
			(
				extrudeGeometry(polygon, 1, "roof") as Polygon
			).getCoordinates()[0]![0],
		).toEqual([1, 1]);
	});
});

describe("extrusion derivations", () => {
	it("derives roof and walls from polygons", () => {
		const polygon = new Polygon([square]);
		const derive = (
			derivation: Parameters<typeof deriveGeometriesFromBase>[1],
		) =>
			deriveGeometriesFromBase(polygon, derivation, {extrusionHeight: 1});

		expect(derive("extrusionRoof")[0]![0]).toBe(
			extrudeGeometry(polygon, 1, "roof"),
		);
		expect(derive("extrusionLitWalls")[0]![0]).toBe(
			extrudeGeometry(polygon, 1, "litWalls"),
		);
		expect(derive("extrusionShadedWalls")[0]![0]).toBe(
			extrudeGeometry(polygon, 1, "shadedWalls"),
		);
	});

	it("leaves points and flat polygons without walls", () => {
		const point = new Point([0, 0]);
		const polygon = new Polygon([square]);

		expect(
			deriveGeometriesFromBase(point, "extrusionRoof", {
				extrusionHeight: 1,
			}),
		).toEqual([[point, {}]]);
		expect(
			deriveGeometriesFromBase(point, "extrusionLitWalls", {
				extrusionHeight: 1,
			}),
		).toEqual([]);
		expect(deriveGeometriesFromBase(polygon, "extrusionRoof")).toEqual([
			[polygon, {}],
		]);
		expect(
			deriveGeometriesFromBase(polygon, "extrusionShadedWalls"),
		).toEqual([]);
	});
});
