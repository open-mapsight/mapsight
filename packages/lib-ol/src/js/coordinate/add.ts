import type {Coordinate} from "ol/coordinate";

import {ensureNonNullable} from "@mapsight/lib-js/nonNullable";

export default function add(
	[aX, aY]: Coordinate,
	[bX, bY]: Coordinate,
): [number, number] {
	return [
		ensureNonNullable(aX) + ensureNonNullable(bX),
		ensureNonNullable(aY) + ensureNonNullable(bY),
	];
}
