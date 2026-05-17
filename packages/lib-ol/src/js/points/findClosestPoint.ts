import type {Coordinate} from "ol/coordinate";

import {ensureNonNullable} from "@mapsight/lib-js/nonNullable";

/**
 * Gets distance between points
 *
 * @param a point a
 * @param b point b
 * @returns distance
 */
function getDistance(a: Coordinate, b: Coordinate): number {
	const [aX, aY] = a;
	const [bX, bY] = b;

	return (
		Math.abs(ensureNonNullable(aX) - ensureNonNullable(bX)) +
		Math.abs(ensureNonNullable(aY) - ensureNonNullable(bY))
	);
}

export type PointsMap = Record<string, Coordinate>;

type PointDistance = [string, number];

/**
 * Finds the closest point to given basePoint [x, y] in map. Returns the key.
 *
 * @param basePoint base point
 * @param pointsMap map of
 * @returns key of the closest point in given pointsMap
 */
export default function findClosestPoint(
	basePoint: Coordinate,
	pointsMap: PointsMap,
): string | null {
	const keys = Object.keys(pointsMap);
	const keyDistances = keys.map(
		(key): PointDistance => [
			key,
			getDistance(basePoint, ensureNonNullable(pointsMap[key])),
		],
	);
	const reduceToSmallestDistance = (
		a: PointDistance | null,
		b: PointDistance,
	) => (a !== null && a[1] > b[1] ? a : b);
	const smallest = keyDistances.reduce(reduceToSmallestDistance, null);

	return smallest === null ? null : smallest[0];
}
