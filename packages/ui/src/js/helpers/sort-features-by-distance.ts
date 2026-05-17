import {getDistance} from "ol/sphere";

import type {
	MapsightUiPlace,
	MapsightUiPlaceGroup,
	MapsightUiPlacesData,
} from "../components/feature-list-sorting/feature-list-sorting";
import type {MapsightUiFeature} from "../types";

/**
 * @param feature feature object
 * @returns anchor
 */
function defaultFeatureAnchorSelector(
	feature: MapsightUiFeature,
): [undefined | null | number, undefined | null | number] {
	if (!feature) {
		return [null, null];
	}

	// TODO: document/collect magic property names
	const bbox = feature.bbox;

	const x = bbox && bbox[0] && bbox[2] && (bbox[0] + bbox[2]) / 2;
	const y = bbox && bbox[1] && bbox[3] && (bbox[1] + bbox[3]) / 2;

	return [x, y];
}

/**
 * @param sorting sorting state
 * @param places places
 * @returns place to sort by or null
 */
function findPlaceForSorting(
	sorting: string,
	places: MapsightUiPlacesData,
): MapsightUiPlace | null {
	const sortingKeys = sorting.split(",");

	let placePointer:
		| MapsightUiPlacesData
		| MapsightUiPlace
		| MapsightUiPlaceGroup = places;

	for (const key of sortingKeys) {
		if (!placePointer[key]) {
			return null;
		}

		placePointer = placePointer[key];

		if ("entries" in placePointer) {
			placePointer = placePointer.entries;
		}
	}

	if ("x" in placePointer && "y" in placePointer) {
		return placePointer as MapsightUiPlace;
	}

	return null;
}

/**
 * sorts features by distance
 *
 * @param features features
 * @param places places
 * @param sorting sorting state
 * @param settings settings
 * @returns sorted features
 */
export default function sortFeaturesByDistance(
	features: Array<MapsightUiFeature>,
	places: MapsightUiPlacesData,
	sorting: null | undefined | string,
	{
		featureAnchorSelector = defaultFeatureAnchorSelector,
	}: {
		// featureAnchorSelector?(feature: MapsightUiFeature): Array<number>;
		featureAnchorSelector?: (feature: MapsightUiFeature) => Array<any>;
	} = {},
): Array<MapsightUiFeature> {
	if (!sorting) {
		return features;
	}

	const placePointer = findPlaceForSorting(sorting, places);
	if (placePointer) {
		const placeCoords = [placePointer.x, placePointer.y];
		return features
			.slice()
			.sort(
				(a, b) =>
					getDistance(placeCoords, featureAnchorSelector(a)) -
					getDistance(placeCoords, featureAnchorSelector(b)),
			);
	}

	return features;
}
