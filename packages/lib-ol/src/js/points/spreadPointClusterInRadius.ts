import type {Coordinate} from "ol/coordinate";

import range from "lodash/range";

import {ensureNonNullable} from "@mapsight/lib-js/nonNullable";

import type {Resolution} from "../index";
import type {PointsMap} from "./findClosestPoint";
import findClosestPoint from "./findClosestPoint";

const FULL_CIRCLE_ANGLE = 2 * Math.PI; // 360 degrees

/**
 * Calculates points evenly spread on circle around center [x, y] on the given radius.
 *
 * @todo consider exporting / moving into separate file
 *
 * @param center center coordinates
 * @param resolution resolution
 * @param radius radius
 * @param number number of points
 * @returns points on circle
 */
function calcPointsOnCircle(
	center: Coordinate,
	resolution: Resolution,
	radius: number,
	number: number,
): Array<Coordinate> {
	const [x, y] = center;
	const spreadRadius = resolution * radius;
	const spreadAngle = FULL_CIRCLE_ANGLE / number;

	return range(number).map((j: number) => [
		ensureNonNullable(x) + spreadRadius * Math.cos(j * spreadAngle),
		ensureNonNullable(y) + spreadRadius * Math.sin(j * spreadAngle),
	]);
}

/**
 * Spreads points around coords in circle around radius
 *
 * @param coords center of the cluster
 * @param resolution current resolution
 * @param radius radius to spread in
 * @param points points to spread
 * @returns spread points
 */
export default function spreadPointClusterInRadius(
	coords: Coordinate,
	resolution: Resolution,
	radius: number,
	points: Array<Coordinate>,
): PointsMap {
	// Check if too close/too many icons?
	//const sehnenLaenge = 2 * spreadRadius * Math.sin(spreadAngle / 2);
	//console.log({sehnenLaenge: sehnenLaenge});

	// We calculate ideal points on the circle with the given radius
	const targetPoints = calcPointsOnCircle(
		coords,
		resolution,
		radius,
		points.length,
	);

	// Copy real points to object
	const realPoints: PointsMap = points.reduce(
		(a, v, k) => ({...a, [String(k)]: v}),
		{},
	);

	// Find the closest real point for each point on the circle, save in object keeping the key of the real point
	const spreadPoints: PointsMap = {};
	for (const targetPoint of targetPoints) {
		const key = findClosestPoint(targetPoint, realPoints);
		if (key) {
			delete realPoints[key];
			spreadPoints[key] = targetPoint;
		}
	}

	return spreadPoints;
}
