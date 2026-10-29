import * as config from "@mapsight/ui/config";
import {
	TAG_FILTER,
	withFilter,
	xhrJson,
} from "@mapsight/ui/config/feature/sources";
import {
	interactiveFeatures,
	metaData,
	osm,
} from "@mapsight/ui/config/map/layers";
import createDefaultPlugins from "@mapsight/ui/plugins/browser-defaults";
import type {CreateOptions} from "@mapsight/ui/types";

import {osmTileUrl} from "../../osm-tile-url.ts";

export {default as styleFunction} from "../../generated/mapsight-vector-styles/demo";
export const baseMapsightConfig = {
	...config.map(
		{
			osm: osm(
				osmTileUrl,
				true,
				metaData(
					"Karte",
					'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-Mitwirkende</a>',
					true,
					false,
					true,
				),
			),
			services: interactiveFeatures(
				"services",
				true,
				metaData("Fiktive Servicestellen", null, true, true),
				{style: "features", mapsightIconId: "info"},
			),
		},
		config.mapView(
			config.mapViewCenter(1171479, 6848253),
			config.mapViewExtent(1097392, 6789091, 1240635, 6895797),
			12,
			10,
			18,
		),
	),
	...config.features({
		services: withFilter(
			xhrJson(new URL("./services.geojson", import.meta.url).toString()),
			TAG_FILTER,
		),
	}),
	...config.featureList("services", true),
};
export const createOptions: CreateOptions = {
	imagesUrl: "/img/",
	lang: "de",
	plugins: createDefaultPlugins({
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
	future: {v8_automaticHeadings: true, v8_listSearchButton: true},
	headings: {baseLevel: 2},
	uiState: {
		map: {show: true},
		list: {
			show: true,
			selectOnClick: "mainAndIcon",
			selectionBehavior: {desktop: null, mobile: null},
			itemsPerPage: 5,
			paginationControl: true,
			tagSwitcherControl: false,
			layerSwitcherControl: false,
		},
		tagSwitcher: {show: true, featureSourceId: "services", sortTags: true},
		places: {
			mitte: {
				title: "Mustermitte (fiktiver Ausgangspunkt)",
				x: 10.5235749073,
				y: 52.2653825653,
			},
			nord: {
				title: "Musternord (fiktiver Ausgangspunkt)",
				x: 10.5235749073,
				y: 52.2928627161,
			},
		},
	},
};
