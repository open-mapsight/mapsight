import type {Coordinate} from "ol/coordinate";

import add from "../coordinate/add";

export default function middleCoordinate(coordinates: Array<Coordinate>) {
	return coordinates.reduce(add, [0, 0]).map((a) => a / coordinates.length);
}
