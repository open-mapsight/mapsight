import {Fragment} from "react";

import MeasureDistanceButton from "@mapsight/ui/components/map-overlay/measure-distance-button";
import RegionSelector from "@mapsight/ui/components/map-overlay/region-selector";
import SearchOverlay from "@mapsight/ui/components/map-overlay/search-overlay";
import SharePositionLinkButton from "@mapsight/ui/components/map-overlay/share-position-link-button";
import * as config from "@mapsight/ui/config";
import {
	TAG_FILTER,
	plain,
	withFilter,
	xhrJson,
} from "@mapsight/ui/config/feature/sources";
import {
	interactiveFeatures,
	metaData,
	osm,
	userGeolocation,
} from "@mapsight/ui/config/map/layers";
import createShareLinkPlugin from "@mapsight/ui/plugins/browser/share-position-link";
import createMeasureDistancePlugin from "@mapsight/ui/plugins/common/measure-distance";
import type {CreateOptions} from "@mapsight/ui/types";

import type {LayerDefinition} from "@mapsight/core/lib/map/lib/WithLayers";

import {DEFAULT_OPTIONS as FIT_FEATURE_DEFAULT_OPTIONS} from "@mapsight/lib-ol/map/fitToFeature";

import createNativeFullscreenPlugin from "../features/native-fullscreen/plugin";

export {default as styleFunction} from "../generated/mapsight-vector-styles/demo";

const clusterFeaturesOptions = {
	distance: 20,
	spreadDistance: 7,
	spreadRadius: 25,
	spreadFeaturesIfCloseToMinResolution: true,
	fitInViewSelections: ["select"],
	fitInViewOptions: {
		...FIT_FEATURE_DEFAULT_OPTIONS,
		duration: 1000,
		maxZoom: 9999,
		nearest: false,
		skipIfInView: false,
	},
};

function withClustering(layer: LayerDefinition): LayerDefinition {
	const source = layer.options?.source;
	if (source?.type === "VectorFeatureSource" && source.options) {
		Object.assign(source.options, {
			clusterFeatures: true,
			clusterFeaturesOptions: clusterFeaturesOptions,
		});
	}
	return layer;
}

export const baseMapsightConfig = {
	...config.map(
		{
			osm: osm(
				"https://tile.openstreetmap.org/{z}/{x}/{y}.png",
				true,
				metaData(
					"OSM",
					'© <a href="https://www.openstreetmap.org/copyright" >OpenStreetMap-Mitwirkende</a>-Mitwirkende',
					true,
					false,
					true,
					"Karte",
				),
			),
			data: withClustering(
				interactiveFeatures(
					"data",
					true,
					metaData("Daten", null, true, true, false, "Gruppe"),
					{
						style: "features",
						mapsightIconId: "charging-station",
					},
				),
			),
			userGeolocation: userGeolocation(
				"userGeolocation",
				true,
				metaData(
					"Benutzerstandort",
					null,
					false,
					false,
					false,
					"Informationen",
				),
			),
			searchResult: interactiveFeatures(
				"searchResult",
				true,
				metaData(
					"Suchergebnis",
					null,
					false,
					false,
					false,
					"Informationen",
				),
			),
		},
		config.mapView(
			config.mapViewCenter(1171479, 6848253), // x, y ^= 52.2653825, 10.523575 (lat, lon)
			config.mapViewExtent(1097392, 6789091, 1240635, 6895797), // minx, miny, maxx, maxy http://bboxfinder.com/#51.938934,9.858041,52.526000,11.144814
			14, // z
			10, // minZoom
			18, // maxZoom
		),
	),
	...config.features({
		data: withFilter(
			xhrJson(new URL("../data.geojson", import.meta.url).toString()),
			TAG_FILTER,
		),
		userGeolocation: plain(),
		searchResult: plain(),
	}),
	...config.featureList("data", true),
};

export const createOptions: CreateOptions = {
	plugins: [
		["shareLink", createShareLinkPlugin()],
		["measureDistance", createMeasureDistancePlugin()],
		["nativeFullscreen", createNativeFullscreenPlugin()],
	],
	imagesUrl: "/public/img/",
	components: {
		MapOverlayTopLeft: () => (
			<Fragment>
				<SearchOverlay />
				<RegionSelector />
				<SharePositionLinkButton />
				<MeasureDistanceButton />
			</Fragment>
		),
	},
	uiState: {
		map: {
			show: true,
		},
		list: {
			show: true,
			selectOnClick: "mainAndIcon",
			selectionBehavior: {
				desktop: "scrollToMap",
				mobile: "showInMapOnlyView",
			},
			paginationControl: true,
			itemsPerPage: 25,
		},
		tagSwitcher: {
			show: true,
			featureSourceId: "data",
			sortTags: true,
		},
		layerSwitcher: {
			show: {
				external: true,
				internal: true,
			},
			internal: {
				grouped: true,
			},
			external: {
				grouped: true,
			},
		},
	},
};
