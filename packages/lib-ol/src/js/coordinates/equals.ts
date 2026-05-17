import type {Coordinate} from "ol/coordinate";

export default function equals(a: Coordinate, b: Coordinate) {
	// FIXME: check index 2, 3, ...
	return a[0] === b[0] && a[1] === b[1];
}
