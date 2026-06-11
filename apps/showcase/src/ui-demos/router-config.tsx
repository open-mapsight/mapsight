import {Fragment} from "react";

import RegionSelector from "@mapsight/ui/components/map-overlay/region-selector";
import SearchOverlay from "@mapsight/ui/components/map-overlay/search-overlay";
import SharePositionLinkButton from "@mapsight/ui/components/map-overlay/share-position-link-button";
import * as config from "@mapsight/ui/config";
import {plain, xhrJson} from "@mapsight/ui/config/feature/sources";
import {
	interactiveFeatures,
	metaData,
	osm,
	userGeolocation,
} from "@mapsight/ui/config/map/layers";
import createDefaultPlugins from "@mapsight/ui/plugins/browser-defaults";
import createShareLinkPlugin from "@mapsight/ui/plugins/browser/share-position-link";
import type {CreateOptions} from "@mapsight/ui/types";

import {demoGeoJsonUrl} from "./demo-geojson.ts";

export {default as styleFunction} from "../generated/mapsight-vector-styles/demo";

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
			data: interactiveFeatures(
				"data",
				true,
				metaData("Daten", null, true, true, false, "Gruppe"),
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
			config.mapViewCenter(1171479, 6848253),
			config.mapViewExtent(1097392, 6789091, 1240635, 6895797),
			14,
			10,
			18,
		),
	),
	...config.features({
		data: xhrJson(demoGeoJsonUrl),
		userGeolocation: plain(),
		searchResult: plain(),
	}),
	...config.featureList("data", true),
};

export const createOptions: CreateOptions = {
	plugins: [
		...createDefaultPlugins(),
		["shareLink", createShareLinkPlugin()],
	],
	imagesUrl: "/img/",
	components: {
		MapOverlayTopLeft: function CustomMapOverlayTopLeft() {
			return (
				<Fragment>
					<SearchOverlay />
					<RegionSelector />
					<SharePositionLinkButton />
				</Fragment>
			);
		},
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
