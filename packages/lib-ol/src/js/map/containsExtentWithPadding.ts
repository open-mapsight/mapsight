import type OlMap from "ol/Map";
import type {Extent} from "ol/extent";
import {containsExtent} from "ol/extent";

import type {Padding} from "../index";
import getPaddedViewExtent from "./getPaddedViewExtent";

export default function containsExtentWithPadding(
	map: OlMap,
	extent: Extent,
	padding?: Padding,
) {
	const viewExtent = padding
		? getPaddedViewExtent(map, padding)
		: map.getView().calculateExtent(map.getSize());
	return viewExtent && containsExtent(viewExtent, extent);
}
