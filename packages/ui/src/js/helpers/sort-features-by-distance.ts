import type {Coordinate} from "ol/coordinate";
import {getDistance} from "ol/sphere";

import getGeoJsonFeatureSortAnchor from "@mapsight/lib-ol/feature/getGeoJsonFeatureSortAnchor";

import type {
	MapsightUiPlace,
	MapsightUiPlaceGroup,
	MapsightUiPlacesData,
} from "../components/feature-list-sorting/feature-list-sorting";
import type {MapsightUiFeature, MapsightUiFeatureId} from "../types";

const defaultFeatureAnchorSelector = (
	feature: MapsightUiFeature,
): Coordinate | null => getGeoJsonFeatureSortAnchor(feature);

function findPlaceForSorting(
	sorting: string,
	places: MapsightUiPlacesData,
): MapsightUiPlace | null {
	const sortingKeys = sorting.split(",");

	let entries: MapsightUiPlacesData = places;
	let node: MapsightUiPlace | MapsightUiPlaceGroup | undefined;

	for (const key of sortingKeys) {
		node = entries[key];
		if (!node) {
			return null;
		}

		if ("entries" in node) {
			entries = node.entries;
		}
	}

	if (node && "x" in node && "y" in node) {
		return node;
	}

	return null;
}

const getSortDistance = (placeCoords: Coordinate, anchor: Coordinate | null) =>
	anchor ? getDistance(placeCoords, anchor) : Number.POSITIVE_INFINITY;

/**
 * sorts features by distance
 */
export default function sortFeaturesByDistance(
	features: Array<MapsightUiFeature>,
	places: MapsightUiPlacesData,
	sorting: null | undefined | string,
	{
		featureAnchorSelector = defaultFeatureAnchorSelector,
	}: {
		featureAnchorSelector?: (
			feature: MapsightUiFeature,
		) => Coordinate | null;
	} = {},
): Array<MapsightUiFeature> {
	if (!sorting) {
		return features;
	}

	const placePointer = findPlaceForSorting(sorting, places);
	if (!placePointer) {
		return features;
	}

	const placeCoords: Coordinate = [placePointer.x, placePointer.y];
	const anchorCache = new Map<
		MapsightUiFeatureId,
		Coordinate | null | undefined
	>();

	const getAnchor = (feature: MapsightUiFeature): Coordinate | null => {
		let anchor = anchorCache.get(feature.id);
		if (anchor === undefined) {
			anchor = featureAnchorSelector(feature);
			anchorCache.set(feature.id, anchor);
		}

		return anchor ?? null;
	};

	return features
		.slice()
		.sort(
			(a, b) =>
				getSortDistance(placeCoords, getAnchor(a)) -
				getSortDistance(placeCoords, getAnchor(b)),
		);
}
