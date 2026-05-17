import type {Extent} from "ol/extent";
import {createEmpty, extend} from "ol/extent";

export default function combineExtents(extents: Array<Extent>) {
	const combinedExtent = createEmpty();
	extents
		.filter((extent) => !!extent)
		.forEach((extent) => extend(combinedExtent, extent));

	return combinedExtent;
}
