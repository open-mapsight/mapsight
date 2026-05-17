import type {Coordinate} from "ol/coordinate";

import {ensureNonNullable} from "@mapsight/lib-js/nonNullable";

export default function toPixel(
	[x, y]: Coordinate,
	resolution: number,
): [number, number] {
	return [
		ensureNonNullable(x) / resolution,
		(ensureNonNullable(y) * -1) / resolution,
	];
}
