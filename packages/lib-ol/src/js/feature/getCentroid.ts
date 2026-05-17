import type Feature from "ol/Feature";
import Point from "ol/geom/Point";

import getExtentCentroid from "../extent/getCentroid";

export default function getCentroid(feature: Feature) {
	const geometry = feature.getGeometry();

	if (!geometry) {
		return null;
	}

	if (geometry instanceof Point) {
		return geometry.getCoordinates();
	}

	return getExtentCentroid(geometry.getExtent());
}
