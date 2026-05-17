import type {Extent} from "ol/extent";

import {assertNonNullable} from "@mapsight/lib-js/nonNullable";

export default function getCentroid([top, right, bottom, left]: Extent): [
	number,
	number,
] {
	assertNonNullable(top);
	assertNonNullable(bottom);
	assertNonNullable(right);
	assertNonNullable(left);
	return [top + (bottom - top) / 2, right + (left - right) / 2];
}
