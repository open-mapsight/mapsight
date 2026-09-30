import type Feature from "ol/Feature";
import type View from "ol/View";
import * as olExtent from "ol/extent";

export type CenterOnFeatureOptions = {
	duration?: number;
};

/** Default duration of the centering animation, in milliseconds. */
export const DEFAULT_CENTER_DURATION = 300;

export const DEFAULT_OPTIONS = {
	duration: DEFAULT_CENTER_DURATION,
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
