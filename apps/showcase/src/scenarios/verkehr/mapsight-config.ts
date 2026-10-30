import {createSmartCityMetricsPartialContentPlugin} from "@mapsight/count-aggregator-ui";
import * as config from "@mapsight/ui/config";
import {
	combinedFeatureSource,
	plain,
} from "@mapsight/ui/config/feature/sources";
import {
	interactiveFeatures,
	metaData,
	osm,
} from "@mapsight/ui/config/map/layers";
import createDefaultPlugins from "@mapsight/ui/plugins/browser-defaults";
import createCombinedVisibleLayersPlugin from "@mapsight/ui/plugins/common/combined-visible-layers";
import type {CreateOptions} from "@mapsight/ui/types";

import {osmTileUrl} from "../../osm-tile-url.ts";
import {trafficData} from "./data.ts";

export {default as styleFunction} from "../../generated/mapsight-vector-styles/demo";
const initial = trafficData(0, "day");
export const baseMapsightConfig = {
	...config.map(
		{
			osm: osm(
				osmTileUrl,
				true,
				metaData(
					"Kartengrundlage",
					'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-Mitwirkende</a>',
					true,
					false,
					true,
				),
			),
			incidents: interactiveFeatures(
				"incidents",
				true,
				metaData("Verkehrsmeldungen", null, true, true),
				{style: "features", mapsightIconId: "baustelle"},
			),
			parking: interactiveFeatures(
				"parking",
				true,
				metaData("Parken", null, true, true),
				{style: "features", mapsightIconId: "parkhaus"},
			),
			counters: interactiveFeatures(
				"counters",
				true,
				metaData("Zählstellen", null, true, true),
				{style: "features", mapsightIconId: "info"},
			),
		},
		config.mapView(
			config.mapViewCenter(1171479, 6848253),
			config.mapViewExtent(1097392, 6789091, 1240635, 6895797),
			13,
			10,
			18,
		),
	),
	...config.features({
		incidents: {
			...plain(),
			data: {type: "FeatureCollection", features: initial.incidents},
		},
		parking: {
			...plain(),
			data: {type: "FeatureCollection", features: initial.parking},
		},
		counters: {
			...plain(),
			data: {type: "FeatureCollection", features: initial.counters},
		},
		traffic: combinedFeatureSource(["incidents", "parking", "counters"]),
	}),
	...config.featureList("traffic", true),
};
export const createOptions: CreateOptions = {
	imagesUrl: "/img/",
	lang: "de",
	plugins: [
		...createDefaultPlugins({
			featureDeepLink: {
				setMapOnlyViewInMobile: false,
				autoRemoveParameters: false,
			},
		}).filter(
			([name]) =>
				![
					"appTitle",
					"localStoragePlugin",
					"noScroll",
					"search",
					"toggleMobileViews",
					"piwikTrackFeatureSelectionEvent",
					"piwikTrackFullscreenToggleEvent",
				].includes(name),
		),
		[
			"combinedVisibleLayers",
			createCombinedVisibleLayersPlugin({
				combinedFeatureSourceId: "traffic",
				members: ["incidents", "parking", "counters"],
			}),
		],
		[
			"trafficMetrics",
			createSmartCityMetricsPartialContentPlugin({
				apiBaseUrl: "/mock/msp/public/count-aggregator",
			}),
		],
	],
	future: {v8_automaticHeadings: true, v8_listSearchButton: true},
	headings: {baseLevel: 2},
	uiState: {
		map: {show: true},
		list: {
			show: true,
			itemsPerPage: 8,
			paginationControl: true,
			selectOnClick: "mainAndIcon",
			selectionBehavior: {desktop: null, mobile: null},
			tagSwitcherControl: false,
			layerSwitcherControl: false,
		},
		layerSwitcher: {
			show: {internal: true, external: false},
			internal: {grouped: false},
		},
	},
};
