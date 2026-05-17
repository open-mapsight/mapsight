import type Feature from "ol/Feature";

export default function getExtent(feature: Feature) {
	const geometry = feature.getGeometry();
	if (!geometry) {
		return null;
	}

	return geometry.getExtent();
}
