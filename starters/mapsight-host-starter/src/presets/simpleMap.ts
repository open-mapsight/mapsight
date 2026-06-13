import {fromLonLat} from "ol/proj";

import * as config from "@mapsight/ui/config";
import {plain, xhrJson} from "@mapsight/ui/config/feature/sources";
import {
	interactiveFeatures,
	metaData,
	osm,
} from "@mapsight/ui/config/map/layers";
import type {MapsightConfig} from "@mapsight/ui/config/schema/index";
import {validateMapsightConfig} from "@mapsight/ui/config/schema/validate";
import createDefaultBrowserPlugins from "@mapsight/ui/plugins/browser-defaults";
import type {CreateOptions} from "@mapsight/ui/types";

import type {MapsightStyleFunction} from "@mapsight/lib-ol/style/styleFunction";

import styleFunction from "../generated/mapsight-vector-styles/demo.js";

/** Fixed demo view — adjust center/zoom for your deployment region. */
const DEMO_CENTER = fromLonLat([10.5, 52.2]);
const DEMO_VIEW = config.mapView(
	DEMO_CENTER,
	config.mapViewExtent(
		DEMO_CENTER[0]! - 40_000,
		DEMO_CENTER[1]! - 40_000,
		DEMO_CENTER[0]! + 40_000,
		DEMO_CENTER[1]! + 40_000,
	),
	12,
);

export type SimpleMapOptions = {
	/** Base URL for Mapsight UI + traffic-style icons (trailing slash). */
	imagesUrl?: string;
	/** GeoJSON URL for the demo feature layer. */
	featureSourceUrl?: string;
	/** OSM-compatible raster tile URL template. */
	basemapUrl?: string;
};

/**
 * Preset factory for `browserEmbed`.
 *
 * Returns the three arguments Mapsight expects: style function, validated config,
 * and browser create options (plugins, imagesUrl, initial UI state).
 */
export function simpleMap(options: SimpleMapOptions = {}): {
	styleFunction: MapsightStyleFunction;
	baseMapsightConfig: MapsightConfig;
	createOptions: CreateOptions;
} {
	const {
		imagesUrl = "/mapsight-assets/img/",
		featureSourceUrl = "/mapsight-assets/data/demo.geojson",
		basemapUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
	} = options;

	return {
		styleFunction,
		baseMapsightConfig: validateMapsightConfig({
			...config.map(
				{
					osm: osm(
						basemapUrl,
						true,
						metaData(
							"OSM",
							'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
							true,
							false,
							true,
							"Map",
						),
					),
					data: interactiveFeatures(
						"data",
						true,
						metaData(
							"Demo points",
							null,
							true,
							true,
							false,
							"Points",
						),
						{style: "features"},
					),
				},
				DEMO_VIEW,
				undefined,
				true,
			),
			...config.features({
				demo: xhrJson(featureSourceUrl),
				userGeolocation: plain(),
				searchResult: plain(),
			}),
			...config.featureList("demo", true),
		}),
		createOptions: {
			plugins: createDefaultBrowserPlugins(),
			imagesUrl,
			uiState: {
				embeddedMap: true,
				list: {
					show: true,
				},
				map: {
					show: true,
				},
			},
		},
	};
}
