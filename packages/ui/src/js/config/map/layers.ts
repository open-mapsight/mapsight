import type {ProjectionLike} from "ol/proj";

import type {
	Description,
	LayerMetaData,
	OptionValue,
	Options,
} from "@mapsight/core/lib/map/types";

import type {MapsightStyleFunctionEnv} from "@mapsight/lib-ol/style/styleFunction";

import {FEATURE_SELECTIONS, FEATURE_SOURCES} from "../constants/controllers";
import {
	FEATURE_SELECTION_HIGHLIGHT,
	FEATURE_SELECTION_SELECT,
} from "../feature/selections";

export function features(
	featureSourceId: string,
	visible = false,
	interactive = false,
	_metaData: LayerMetaData = {},
	style: string | MapsightStyleFunctionEnv = "features",
	sourceOptions?: Options,
): Description {
	return {
		type: "VectorLayer",
		options: {
			visible: visible,
			style: style as OptionValue,
			//updateWhileAnimating: true,
			//updateWhileInteracting: true,
			renderBuffer: 200,
			source: {
				type: "VectorFeatureSource",
				options: {
					featureSourceId,
					featureSourcesControllerName: FEATURE_SOURCES,
					featureSelectionsControllerName: FEATURE_SELECTIONS,
					...sourceOptions,
				},
			},
			selections: !interactive
				? {}
				: {
						//'second-touch': FEATURE_SELECTION_SELECT,
						//touch: FEATURE_SELECTION_HIGHLIGHT,
						mousedown: FEATURE_SELECTION_SELECT,
						touch: FEATURE_SELECTION_SELECT,
						mouseover: FEATURE_SELECTION_HIGHLIGHT,
					},
		},
		metaData: _metaData,
	};
}

export function interactiveFeatures(
	featureSourceId,
	visible = false,
	_metaData = {},
	style: string | MapsightStyleFunctionEnv = "features",
	sourceOptions?: Options,
) {
	return features(
		featureSourceId,
		visible,
		true,
		_metaData,
		style,
		sourceOptions,
	);
}

export function userGeolocation(
	featureSourceId: string,
	visible = false,
	_metaData: LayerMetaData = {},
	style: string | MapsightStyleFunctionEnv = "userGeolocation",
	sourceOptions?: Options,
) {
	const base = features(
		featureSourceId,
		visible,
		false,
		_metaData,
		style,
		sourceOptions,
	);

	return {
		...base,
		options: {
			...base.options,
			updateWhileAnimating: true,
			updateWhileInteracting: true,
			renderBuffer: 400,
		},
	};
}

export function osm(url: string, visible = false, _metaData = {}) {
	return {
		type: "TileLayer",
		metaData: _metaData,
		options: {
			source: {
				type: "OsmSource",
				options: {url},
			},
			visible,
		},
	};
}

export function wms(
	url: string,
	params = {},
	projection: ProjectionLike = "ESPG:3857",
	visible = false,
	_metaData: LayerMetaData = {},
	opacity?: number,
) {
	return {
		type: "TileLayer",
		metaData: _metaData,
		options: {
			source: {
				type: "TileWMSSource",
				options: {
					projection,
					url,
					params,
				},
			},
			visible,
			opacity,
		},
	};
}

// TODO metadata auftrennen in metaData, withAttribution() und withLegend()
export function metaData(
	title: string,
	attribution: string | null = null,
	visibleInLayerSwitcher = false,
	visibleInExternalLayerSwitcher = false,
	isBaseLayer = false,
	group: string | null = null,
	lockedInLayerSwitcher = undefined,
): LayerMetaData {
	return {
		title,
		attribution: attribution ?? undefined,
		visibleInLayerSwitcher,
		visibleInExternalLayerSwitcher,
		group: group ?? undefined,
		isBaseLayer,
		lockedInLayerSwitcher, // users can't change layer's visbility TODO this has to be implemented
	};
}

export function metaDataWithAttribution(
	_metaData: LayerMetaData = {},
	attribution: string,
): LayerMetaData {
	return {
		..._metaData,
		attribution: attribution,
	};
}

export function metaDataWithLegend(
	_metaData: LayerMetaData = {},
	legend,
): LayerMetaData {
	return {
		..._metaData,
		legend: legend,
	};
}

export function metaDataWithMiniLegend(
	_metaData: LayerMetaData = {},
	miniLegend,
): LayerMetaData {
	return {
		..._metaData,
		miniLegend: miniLegend,
	};
}
