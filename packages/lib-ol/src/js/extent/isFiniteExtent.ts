import type {Extent} from "ol/extent";

export default function isFiniteExtent(extent: Extent) {
	return !extent.some(
		(coordinate) => coordinate === Infinity || coordinate === -Infinity,
	);
}
