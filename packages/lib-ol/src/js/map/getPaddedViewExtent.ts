import type OlMap from "ol/Map";
import * as olExtent from "ol/extent";

import {ensureNonNullable} from "@mapsight/lib-js/nonNullable";

import type {Padding} from "../index";

export default function getPaddedViewExtent(map: OlMap, padding: Padding) {
	const size = map.getSize();
	if (size === undefined) {
		return null;
	}

	// remove padding from size (pixels)
	const [mapWidth, mapHeight] = size;
	const [top, right, bottom, left] = padding;
	const innerMapWith = ensureNonNullable(mapWidth) - left - right;
	const innerMapHeight = ensureNonNullable(mapHeight) - top - bottom;
	const innerMapSize = [innerMapWith, innerMapHeight];

	// pixels -> coondinate
	const paddedCenterPixel = [
		left + innerMapWith / 2,
		top + innerMapHeight / 2,
	];
	const innerCenterCoordinate = map.getCoordinateFromPixel(paddedCenterPixel);

	const view = map.getView();
	const resolution = view.getResolution();
	const rotation = view.getRotation();

	if (!resolution) {
		return null;
	}

	return olExtent.getForViewAndSize(
		innerCenterCoordinate,
		resolution,
		rotation,
		innerMapSize,
	);
}
