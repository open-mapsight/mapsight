import type {Coordinate} from "ol/coordinate";
import GeoJSON from "ol/format/GeoJSON";

import getExtentCentroid from "../extent/getCentroid";

type GeoJsonBbox = [number, number, number, number];

type GeoJsonGeometryLike = {
	type: string;
	coordinates?: unknown;
};

export type GeoJsonFeatureLike = {
	bbox?: GeoJsonBbox;
	geometry?: GeoJsonGeometryLike | null;
};

const geoJsonFormat = new GeoJSON();

let hasLoggedNonPointGeometryFallbackWarning = false;

function isFiniteBbox(bbox: GeoJsonBbox): bbox is GeoJsonBbox {
	return bbox.every(Number.isFinite);
}

function getBboxCenter(bbox: GeoJsonBbox): Coordinate | null {
	if (!isFiniteBbox(bbox)) {
		return null;
	}

	const [minX, minY, maxX, maxY] = bbox;
	return getExtentCentroid([minX, minY, maxX, maxY]);
}

function isLonLatPair(value: unknown): value is [number, number] {
	return (
		Array.isArray(value) &&
		value.length >= 2 &&
		typeof value[0] === "number" &&
		typeof value[1] === "number" &&
		Number.isFinite(value[0]) &&
		Number.isFinite(value[1])
	);
}

function getPointCoordinates(geometry: GeoJsonGeometryLike): Coordinate | null {
	if (geometry.type !== "Point") {
		return null;
	}

	if (!isLonLatPair(geometry.coordinates)) {
		return null;
	}

	return [geometry.coordinates[0], geometry.coordinates[1]];
}

function warnNonPointGeometryFallbackOnce() {
	if (hasLoggedNonPointGeometryFallbackWarning) {
		return;
	}

	hasLoggedNonPointGeometryFallbackWarning = true;
	console.warn(
		"@mapsight/lib-ol: deriving feature sort anchors from non-Point GeoJSON geometries; add feature.bbox where possible for better performance.",
	);
}

function getNonPointGeometryCenter(
	geometry: GeoJsonGeometryLike,
): Coordinate | null {
	warnNonPointGeometryFallbackOnce();

	const olGeometry = geoJsonFormat.readGeometry(geometry);
	if (!olGeometry) {
		return null;
	}

	return getExtentCentroid(olGeometry.getExtent());
}

/**
 * Returns a WGS84 lon/lat anchor suitable for `ol/sphere.getDistance`.
 *
 * Prefers `feature.bbox` when present. For Point geometries without bbox,
 * reads coordinates directly. Other geometry types fall back to OpenLayers
 * geometry parsing and extent center (with a one-time console warning).
 */
export default function getGeoJsonFeatureSortAnchor(
	feature: GeoJsonFeatureLike | null | undefined,
): Coordinate | null {
	if (!feature) {
		return null;
	}

	if (feature.bbox) {
		const bboxCenter = getBboxCenter(feature.bbox);
		if (bboxCenter) {
			return bboxCenter;
		}
	}

	const geometry = feature.geometry;
	if (!geometry) {
		return null;
	}

	if (geometry.type === "Point") {
		return getPointCoordinates(geometry);
	}

	return getNonPointGeometryCenter(geometry);
}

export function resetGeoJsonFeatureSortAnchorWarningForTests() {
	hasLoggedNonPointGeometryFallbackWarning = false;
}
