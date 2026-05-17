import type Feature from "ol/Feature";
import type OlMap from "ol/Map";

import getExtent from "../features/getExtentForFeatures";
import type {ExtendedFitOptions} from "./fitToExtent";
import fitToExtent from "./fitToExtent";
import {DEFAULT_OPTIONS as SINGLE_FEATURE_DEFAULT_OPTIONS} from "./fitToFeature";

export const DEFAULT_OPTIONS = {...SINGLE_FEATURE_DEFAULT_OPTIONS};

export default function fitToFeatures(
	map: OlMap,
	features: Array<Feature>,
	options: ExtendedFitOptions = DEFAULT_OPTIONS,
) {
	if (!features.length) {
		return;
	}

	fitToExtent(map, getExtent(features), options);
}
