import type {Coordinate} from "ol/coordinate";

/**
 * XY-only coordinate equality: compares the first two ordinates and
 * intentionally ignores any further ones (Z, M, …) — the map data handled
 * here is 2D.
 */
export default function equals(a: Coordinate, b: Coordinate) {
	return a[0] === b[0] && a[1] === b[1];
}
