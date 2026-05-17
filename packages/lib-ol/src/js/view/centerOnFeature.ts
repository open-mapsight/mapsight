import type Feature from "ol/Feature";
import type View from "ol/View";
import * as olExtent from "ol/extent";

export type CenterOnFeatureOptions = {
	duration?: number;
};

export const DEFAULT_OPTIONS = {
	duration: 300, // TODO: MAGIC NUMBER!
};

export default function centerOnFeature(
	view: View,
	feature: Feature,
	options: CenterOnFeatureOptions = DEFAULT_OPTIONS,
) {
	const featureExtent = feature.getGeometry()?.getExtent();
	if (featureExtent) {
		const center = olExtent.getCenter(featureExtent);
		view.animate({center: center, ...options});
	}
}
