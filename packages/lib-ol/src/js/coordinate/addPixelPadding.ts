import type {Coordinate} from "ol/coordinate";

import type {Padding} from "../index";
import add from "./add";
import fromPixel from "./fromPixel";

/**
 * @param resolution Resolution
 * @param coordinate Coordinate
 * @param padding Padding (in pixels) to be cleared inside the view. Values in the array are top, right, bottom and left padding. Default is [0, 0, 0, 0]. Required.
 * @returns coordinate with added pixel padding
 */
export default function addPixelPadding(
	resolution: number,
	coordinate: Coordinate,
	[top, right, bottom, left]: Padding = [0, 0, 0, 0],
): Coordinate {
	const pixelDelta = [(right - left) / 2, (bottom - top) / 2];

	return add(coordinate, fromPixel(pixelDelta, resolution));
}
