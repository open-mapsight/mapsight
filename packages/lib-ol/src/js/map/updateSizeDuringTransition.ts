import type OlMap from "ol/Map";

import animateDuringTransition from "./animateDuringTransition";

export default function updateSizeDuringTransition(map: OlMap) {
	return animateDuringTransition(map, () => {
		map.updateSize();
	});
}
