import Circle from "ol/geom/Circle";
import GeometryCollection from "ol/geom/GeometryCollection";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";

import {describe, expect, it} from "vitest";

import geometriesEqual from "./geometriesEqual.ts";

describe("geometriesEqual", () => {
	it("treats the same instance as equal", () => {
		const point = new Point([1, 2]);
		expect(geometriesEqual(point, point)).toBe(true);
	});

	it("compares simple geometries by type, layout, and flat coordinates", () => {
		expect(geometriesEqual(new Point([1, 2]), new Point([1, 2]))).toBe(
			true,
		);
		expect(geometriesEqual(new Point([1, 2]), new Point([1, 3]))).toBe(
			false,
		);
		expect(
			geometriesEqual(
				new LineString([
					[0, 0],
					[1, 1],
				]),
				new Point([0, 0]),
			),
		).toBe(false);
		expect(
			geometriesEqual(new Point([1, 2]), new Point([1, 2, 3], "XYZ")),
		).toBe(false);
	});

	it("includes Circle radius in the flat-coordinate comparison", () => {
		expect(
			geometriesEqual(new Circle([0, 0], 5), new Circle([0, 0], 5)),
		).toBe(true);
		expect(
			geometriesEqual(new Circle([0, 0], 5), new Circle([0, 0], 6)),
		).toBe(false);
	});

	it("compares GeometryCollection children recursively", () => {
		const left = new GeometryCollection([
			new Point([1, 2]),
			new LineString([
				[0, 0],
				[1, 1],
			]),
		]);
		const right = new GeometryCollection([
			new Point([1, 2]),
			new LineString([
				[0, 0],
				[1, 1],
			]),
		]);
		const different = new GeometryCollection([
			new Point([1, 2]),
			new LineString([
				[0, 0],
				[2, 2],
			]),
		]);

		expect(geometriesEqual(left, right)).toBe(true);
		expect(geometriesEqual(left, different)).toBe(false);
		expect(geometriesEqual(left, new Point([1, 2]))).toBe(false);
	});

	it("returns false for non-geometry values that are not the same reference", () => {
		expect(geometriesEqual(undefined, undefined)).toBe(true);
		expect(geometriesEqual(undefined, new Point([0, 0]))).toBe(false);
		expect(geometriesEqual({x: 1}, {x: 1})).toBe(false);
	});
});
