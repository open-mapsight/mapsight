import type {Extent} from "ol/extent";

import proj4 from "proj4";

import type {MapsightUiFeature} from "../types";

const WGS84 = "WGS84";
const WEB_MERCATOR = "EPSG:3857";

/** `[west, south, east, north]` from a GeoJSON 2D (4) or 3D (6) bbox. */
export function lonLatBbox(
	bbox: number[] | undefined,
): [number, number, number, number] | null {
	if (!bbox) {
		return null;
	}
	const west = bbox[0];
	const south = bbox[1];
	if (typeof west !== "number" || typeof south !== "number") {
		return null;
	}
	if (bbox.length === 4) {
		const east = bbox[2];
		const north = bbox[3];
		if (typeof east !== "number" || typeof north !== "number") {
			return null;
		}
		return [west, south, east, north];
	}
	if (bbox.length === 6) {
		const east = bbox[3];
		const north = bbox[4];
		if (typeof east !== "number" || typeof north !== "number") {
			return null;
		}
		return [west, south, east, north];
	}
	return null;
}

export function lonLatFromGeometry(
	feature: MapsightUiFeature,
): {lon: number; lat: number} | null {
	const geometry = feature.geometry as
		{type?: string; coordinates?: unknown} | undefined;
	if (geometry?.type === "Point" && Array.isArray(geometry.coordinates)) {
		const lon = geometry.coordinates[0];
		const lat = geometry.coordinates[1];
		if (typeof lon === "number" && typeof lat === "number") {
			return {lon, lat};
		}
	}
	const bbox = lonLatBbox(feature.bbox);
	if (bbox) {
		return {lon: (bbox[0] + bbox[2]) / 2, lat: (bbox[1] + bbox[3]) / 2};
	}
	return null;
}

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
