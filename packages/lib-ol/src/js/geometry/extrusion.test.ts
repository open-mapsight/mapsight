import type {Coordinate} from "ol/coordinate";
import MultiPolygon from "ol/geom/MultiPolygon";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";

import {describe, expect, it} from "vitest";

import deriveGeometriesFromBase from "./deriveGeometriesFromBase.ts";
import extrudeGeometry, {extrudeRings} from "./extrusion.ts";

// Counter-clockwise unit square: only the south wall has visible area.
const square: Array<Coordinate> = [
	[0, 0],
	[1, 0],
	[1, 1],
	[0, 1],
	[0, 0],
];

describe("extrudeRings", () => {
	it("moves the roof north and skips hidden and zero-area walls", () => {
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
		expect(litWalls).toEqual([]);
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
		]);
	});

	it("lights the west-facing wall of a rotated rectangle for either winding", () => {
		const rectangle = new Polygon([
			[
				[0, 0],
				[4, 0],
				[4, 2],
				[0, 2],
				[0, 0],
			],
		]);
		rectangle.rotate(Math.PI / 6, [0, 0]);
		const ring = rectangle.getCoordinates()[0]!;
		const counterClockwise = extrudeRings([ring], 2);
		const clockwise = extrudeRings([[...ring].reverse()], 2);
		const normalize = (walls: typeof clockwise.litWalls) =>
			walls
				.map(([wall]) =>
					wall!
						.slice(0, -1)
						.map((point) => point.join(","))
						.sort()
						.join(";"),
				)
				.sort();

		expect(counterClockwise.litWalls).toHaveLength(1);
		expect(counterClockwise.shadedWalls).toHaveLength(1);
		expect(counterClockwise.litWalls[0]![0]!.slice(0, 2)).toEqual([
			ring[3],
			ring[4],
		]);
		expect(counterClockwise.shadedWalls[0]![0]!.slice(0, 2)).toEqual([
			ring[0],
			ring[1],
		]);
		for (const walls of [
			counterClockwise.litWalls,
			counterClockwise.shadedWalls,
		]) {
			expect(new MultiPolygon(walls).getArea()).toBeGreaterThan(0);
		}
		expect(normalize(clockwise.litWalls)).toEqual(
			normalize(counterClockwise.litWalls),
		);
		expect(normalize(clockwise.shadedWalls)).toEqual(
			normalize(counterClockwise.shadedWalls),
		);
	});

	it.each([
		[false, false],
		[false, true],
		[true, false],
		[true, true],
	])(
		"draws courtyard walls with reversed outer=%s and inner=%s rings",
		(reverseOuter, reverseInner) => {
			const outer: Array<Coordinate> = [
				[0, 0],
				[10, 0],
				[10, 10],
				[0, 10],
				[0, 0],
			];
			const inner: Array<Coordinate> = [
				[3, 3],
				[3, 7],
				[7, 7],
				[7, 3],
				[3, 3],
			];
			const rings = [
				reverseOuter ? outer.reverse() : outer,
				reverseInner ? inner.reverse() : inner,
			];
			const {roof, litWalls, shadedWalls} = extrudeRings(rings, 1);
			expect(new Polygon(roof).intersectsCoordinate([5, 7.5])).toBe(
				false,
			);
			expect(
				new MultiPolygon(shadedWalls).intersectsCoordinate([5, 7.5]),
			).toBe(true);
			expect(
				new MultiPolygon(shadedWalls).intersectsCoordinate([5, 3.5]),
			).toBe(false);
			expect(litWalls).toEqual([]);
			expect(new Polygon(rings).getArea()).toBe(84);
		},
	);

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
			[2, 0],
		]);
	});

	it("evicts old heights while sharing recently used parts between groups", () => {
		const polygon = new Polygon([square]);
		const firstRoof = extrudeGeometry(polygon, 1, "roof");
		const recentWalls = extrudeGeometry(polygon, 2, "shadedWalls");
		for (let height = 3; height <= 1000; height++) {
			extrudeGeometry(polygon, height, "roof");
			expect(extrudeGeometry(polygon, 2, "shadedWalls")).toBe(
				recentWalls,
			);
		}
		expect(extrudeGeometry(polygon, 1, "roof")).not.toBe(firstRoof);
		expect(polygon.getCoordinates()).toEqual([square]);
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

	it.each([NaN, Infinity, -Infinity, -1, 0])(
		"uses a flat footprint for height %s",
		(height) => {
			const polygon = new Polygon([square]);
			expect(
				deriveGeometriesFromBase(polygon, "extrusionRoof", {
					extrusionHeight: height,
				}),
			).toEqual([[polygon, {}]]);
			for (const derivation of [
				"extrusionLitWalls",
				"extrusionShadedWalls",
			] as const) {
				expect(
					deriveGeometriesFromBase(polygon, derivation, {
						extrusionHeight: height,
					}),
				).toEqual([]);
			}
		},
	);
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
