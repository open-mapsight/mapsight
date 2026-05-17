import type {Coordinate} from "ol/coordinate";

import {ensureNonNullable} from "@mapsight/lib-js/nonNullable";

export default function scale([x, y]: Coordinate, s: number): [number, number] {
	return [ensureNonNullable(x) * s, ensureNonNullable(y) * s];
}
