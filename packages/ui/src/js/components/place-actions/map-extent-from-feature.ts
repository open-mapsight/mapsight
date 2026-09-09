import type {Extent} from "ol/extent";

import proj4 from "proj4";

import type {MapsightUiFeature} from "../../types";
import {lonLatBbox, lonLatFromGeometry} from "./resolve-place-actions";

const WGS84 = "WGS84";
const WEB_MERCATOR = "EPSG:3857";

function project(lon: number, lat: number): [number, number] {
	return proj4(WGS84, WEB_MERCATOR, [lon, lat]);
}

/** Web Mercator extent for `animate({bounds})`. Point geometries collapse to a point. */
export function mapExtentFromFeature(
	feature: MapsightUiFeature,
): Extent | null {
	const bbox = lonLatBbox(feature.bbox);
	if (bbox) {
		const [x1, y1] = project(bbox[0], bbox[1]);
		const [x2, y2] = project(bbox[2], bbox[3]);
		return [x1, y1, x2, y2];
	}

	const coords = lonLatFromGeometry(feature);
	if (!coords) {
		return null;
	}
	const [x, y] = project(coords.lon, coords.lat);
	return [x, y, x, y];
}
