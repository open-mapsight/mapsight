import type {Coordinate} from "ol/coordinate";
import type {Extent} from "ol/extent";
import type {ProjectionLike} from "ol/proj";

import type {FeatureSourceState} from "@mapsight/core/lib/feature-sources/types";
import type {FeatureInteractions} from "@mapsight/core/lib/map/lib/WithFeatureInteractions";
import type {LayerDefinition} from "@mapsight/core/lib/map/lib/WithLayers";
import type {Options} from "@mapsight/core/lib/map/types";

import {
	FEATURE_LIST,
	FEATURE_SELECTIONS,
	FEATURE_SOURCES,
	MAP,
	PROJECTIONS,
	TIME_FILTER,
} from "./constants/controllers";
import featureSelections, {
	FEATURE_SELECTION_HIGHLIGHT,
	FEATURE_SELECTION_SELECT,
} from "./feature/selections";
import createFeatureInteractions from "./map/featureInteractions";
import mapInteractions from "./map/interactions";

export const defaultProjections: Array<ProjectionLike> = [];

export function mapViewCenter(x: number, y: number): Coordinate {
	return [x, y];
}

export function mapViewExtent(
	minx: number,
	miny: number,
	maxx: number,
	maxy: number,
): Extent {
	return [minx, miny, maxx, maxy];
}

export function mapView(
	center: Coordinate,
	extent: Extent,
	zoom = 13,
	minZoom = 5,
	maxZoom = 18,
): Options {
	return {
		center: center,
		extent: extent,
		zoom: zoom,
		minZoom: minZoom,
		maxZoom: maxZoom,
	};
}

// FIXME need function for layers

export function map(
	layers: Record<string, LayerDefinition>,
	view: Options,
	projections = defaultProjections,
	visible = false,
	featureInteractions: FeatureInteractions = createFeatureInteractions(),
) {
	if (!projections) {
		projections = defaultProjections;
	}

	return {
		[MAP]: {
			layers: layers,
			moveTolerance: 2,
			interactions: mapInteractions,
			featureInteractions: featureInteractions,
			view: view,
			visible: visible,
		},
		[PROJECTIONS]: projections,
	};
}

export function features(
	featureSources: Record<string, Partial<FeatureSourceState>>,
) {
	return {
		[FEATURE_SELECTIONS]: featureSelections,
		[FEATURE_SOURCES]: featureSources,
	};
}

// TODO derzeit ist nur eine Liste erlaubt!
export function featureList(featureSourceName: string, visible = false) {
	return {
		[FEATURE_LIST]: {
			visible: visible,
			featureSource: featureSourceName,
			featureSelectionHighlight: FEATURE_SELECTION_HIGHLIGHT,
			featureSelectionSelect: FEATURE_SELECTION_SELECT,
		},
	};
}

export function timeFilter(visible = false) {
	return {
		[TIME_FILTER]: {
			// TODO dies gehört nicht in diese js/config und nicht in die
			//  Eigenschaften des TimeFilter-FilterController, sondern in den uiState
			visible: visible,
		},
	};
}

export function defaultTopOffsetForView(_view: string) {
	return 0;
}

/** @type {import('../types').SiteConfig} */
export const siteConfig = {
	/** base url of app. this must be set for server-side rendering and is not used when run in browser */
	baseUrl: "//set this for server based rendering//",

	/** images base url */
	imagesUrl: "/images/",

	/** search api url for feature search */
	searchUrl: "/poi-search-api/",

	/** search api query parameter for feature search */
	searchQueryParameter: "query",

	/** function to get top offset for the given view */
	topOffsetForView: defaultTopOffsetForView,
};
