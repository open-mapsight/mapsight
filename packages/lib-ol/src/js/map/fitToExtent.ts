import type OlMap from "ol/Map";
import type {FitOptions} from "ol/View";
import type {Extent} from "ol/extent";

import isFiniteExtent from "../extent/isFiniteExtent";
import type {Padding} from "../index";
import containsExtentWithPadding from "./containsExtentWithPadding";

export type ExtendedFitOptions = FitOptions & {
	keepZoom: boolean;
	skipIfInView: boolean;
};

export const DEFAULT_OPTIONS: ExtendedFitOptions = {
	duration: 300, // TODO: MAGIC NUMBER!
	padding: [60, 100, 60, 100], // TODO: MAGIC NUMBER!
	keepZoom: false, // TODO: Document keepZoom option!
	maxZoom: 17, // TODO: MAGIC NUMBER!
	skipIfInView: true, // TODO: Document skipIfInView option!
};

// TODO: Document keepZoom option!
// TODO: Document skipIfInView option!
export default function fitToExtent(
	map: OlMap,
	extent: Extent,
	options: ExtendedFitOptions = DEFAULT_OPTIONS,
) {
	if (!isFiniteExtent(extent)) {
		return;
	}

	const padding = (options.padding || [0, 0, 0, 0]) as Padding;

	if (
		options.skipIfInView === false ||
		!containsExtentWithPadding(map, extent, padding)
	) {
		const view = map.getView();
		view.fit(extent, {
			...options,
			maxZoom: options.keepZoom ? view.getZoom() : options.maxZoom,
		});
	}
}
