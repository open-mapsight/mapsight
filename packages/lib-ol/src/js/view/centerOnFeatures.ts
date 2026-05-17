import type Feature from "ol/Feature";
import type View from "ol/View";
import * as olExtent from "ol/extent";

import type {CenterOnFeatureOptions} from "./centerOnFeature";
import {DEFAULT_OPTIONS as SINGLE_FEATURE_DEFAULT_OPTIONS} from "./centerOnFeature";

export const DEFAULT_OPTIONS = {...SINGLE_FEATURE_DEFAULT_OPTIONS};

export default function centerOnFeatures(
	view: View,
	features: Array<Feature>,
	options: CenterOnFeatureOptions = DEFAULT_OPTIONS,
) {
	if (!features || !features.length) {
		return;
	}

	// combine extents
	const featuresExtent = olExtent.createEmpty();
	features.forEach((feature) => {
		const extent = feature.getGeometry()?.getExtent();
		if (extent) {
			olExtent.extend(featuresExtent, extent);
		}
	});

	const center = olExtent.getCenter(featuresExtent);
	view.animate({center: center, ...options});
}
