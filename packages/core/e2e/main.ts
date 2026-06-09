import "@/test/inject-default-ol-proxy";

import {
	centerPixel,
	createHighlightTestMap,
	getHighlightFeatures,
} from "@/test/create-highlight-test-map";

const mountTarget = document.querySelector("#map");
if (!mountTarget) {
	throw new Error("Map target element #map was not found");
}

const {store, map} = createHighlightTestMap({
	stubHits: false,
	mountTarget: mountTarget as HTMLDivElement,
});

map.renderSync();

declare global {
	interface Window {
		__mapsightHighlightTest?: {
			ready: boolean;
			getHighlightFeatures: () => string[];
			centerClientPosition: () => {x: number; y: number};
			emptyClientPosition: () => {x: number; y: number};
		};
	}
}

function clientPositionForMapPixel(pixel: [number, number]) {
	const element = map.getTargetElement();
	if (!element) {
		throw new Error("Map target element is not set");
	}
	const rect = element.getBoundingClientRect();
	return {
		x: rect.left + pixel[0],
		y: rect.top + pixel[1],
	};
}

window.__mapsightHighlightTest = {
	ready: true,
	getHighlightFeatures: () => getHighlightFeatures(store),
	centerClientPosition: () => clientPositionForMapPixel(centerPixel(map)),
	/** Top-left corner — well outside the point feature and hit tolerance. */
	emptyClientPosition: () => clientPositionForMapPixel([8, 8]),
};
