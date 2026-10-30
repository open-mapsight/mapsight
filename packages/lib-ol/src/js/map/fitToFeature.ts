import type Feature from "ol/Feature";
import type OlMap from "ol/Map";

import getExtent from "../feature/getExtent";
import type {ExtendedFitOptions} from "./fitToExtent";
import fitToExtent, {
	DEFAULT_OPTIONS as DEFAULT_OPTIONS_BASE,
} from "./fitToExtent";

export const DEFAULT_OPTIONS = {...DEFAULT_OPTIONS_BASE};

/**
 * Fits the view to the feature's extent. See {@link ExtendedFitOptions} for
 * the `keepZoom` and `skipIfInView` behavior.
 */
export default function fitToFeature(
	map: OlMap,
	feature: Feature,
	options: ExtendedFitOptions = DEFAULT_OPTIONS,
) {
	if (!feature) {
		return;
	}

	const extent = getExtent(feature);
	if (!extent) {
		return;
	}

	fitToExtent(map, extent, options);
}
