"use client";

import {Fragment, useMemo} from "react";

import App from "@mapsight/ui/components/app";
import Instance from "@mapsight/ui/components/instance";
import MeasureDistanceButton from "@mapsight/ui/components/map-overlay/measure-distance-button";
import RegionSelector from "@mapsight/ui/components/map-overlay/region-selector";
import SearchOverlay from "@mapsight/ui/components/map-overlay/search-overlay";
import SharePositionLinkButton from "@mapsight/ui/components/map-overlay/share-position-link-button";
import {map, mapView, mapViewCenter, mapViewExtent} from "@mapsight/ui/config";
import * as config from "@mapsight/ui/config";
import {TAG_FILTER} from "@mapsight/ui/config/constants/controllers";
import {plain, withFilter, xhrJson} from "@mapsight/ui/config/feature/sources";
import {
	interactiveFeatures,
	metaData,
	osm,
	userGeolocation,
} from "@mapsight/ui/config/map/layers";
import createDefaultBrowserPlugins from "@mapsight/ui/plugins/browser-defaults";
import createNativeFullscreenPlugin from "@mapsight/ui/plugins/browser/native-fullscreen";
import createShareLinkPlugin from "@mapsight/ui/plugins/browser/share-position-link";
import createLangPlugin from "@mapsight/ui/plugins/common/lang";
import createMeasureDistancePlugin from "@mapsight/ui/plugins/common/measure-distance";
import createDefaultServerPlugins from "@mapsight/ui/plugins/server-defaults";
import {CreateOptions, PluginDefinition} from "@mapsight/ui/types";

import styleFunction from "@/generated/mapsight-vector-styles/demo";

const bmc = {
	...map(
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
		mapView(
			mapViewCenter(1171479, 6848253), // x, y ^= 52.2653825, 10.523575 (lat, lon)
			mapViewExtent(1097392, 6789091, 1240635, 6895797), // minx, miny, maxx, maxy http://bboxfinder.com/#51.938934,9.858041,52.526000,11.144814
			14, // z
			10, // minZoom
			18, // maxZoom
		),
	),
	...config.features({
		data: withFilter(xhrJson("/data.geojson"), TAG_FILTER),
		userGeolocation: plain(),
		searchResult: plain(),
	}),
	...config.featureList("data", true),
};

export default function MapsightAppUi() {
	const isClient =
		typeof window !== "undefined" && typeof document !== "undefined";
	const createOptions = useMemo<CreateOptions>(
		() => ({
			lang: "de",
			imagesUrl: "/img/",
			plugins: [
				["lang", createLangPlugin()],
				["measureDistance", createMeasureDistancePlugin()],
				...(isClient
					? ([
							...createDefaultBrowserPlugins(),
							["shareLink", createShareLinkPlugin()],
							[
								"nativeFullscreen",
								createNativeFullscreenPlugin(),
							],
						] as PluginDefinition[])
					: createDefaultServerPlugins()),
			],
			uiState: {
				view: "desktop", // TODO: infer view client AND server side
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
		}),
		[isClient],
	);

	return (
		<div>
			<h1>Mapsight Map</h1>
			<Instance
				baseMapsightConfig={bmc}
				createOptions={createOptions}
				styleFunction={styleFunction}
			>
				<App />
			</Instance>
		</div>
	);
}
