import type {Pixel} from "ol/pixel";

import {ensureNonNullable} from "@mapsight/lib-js/nonNullable";

export default function fromPixel([x, y]: Pixel, resolution: number) {
	return [
		ensureNonNullable(x) * resolution,
		ensureNonNullable(y) * -1 * resolution,
	];
}
