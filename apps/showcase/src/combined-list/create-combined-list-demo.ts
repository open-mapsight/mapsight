import * as config from "@mapsight/ui/config";
import {
	TAG_FILTER,
	combinedFeatureSource,
	withFilter,
	xhrJson,
} from "@mapsight/ui/config/feature/sources";
import {
	interactiveFeatures,
	metaData,
	osm,
} from "@mapsight/ui/config/map/layers";
import createCombinedVisibleLayersPlugin from "@mapsight/ui/plugins/common/combined-visible-layers";
import type {CreateOptions} from "@mapsight/ui/types";

/** Feature source and layer id for the parks demo layer. */
export const PARKS_LAYER_ID = "parks";

/** Feature source and layer id for the cafes demo layer. */
export const CAFES_LAYER_ID = "cafes";

/** Combined list feature source id (aggregates visible member layers). */
export const LIST_COMBINED_FEATURE_SOURCE_ID = "listCombined";

/** Member layers that feed the combined list when visible. */
export const LIST_MEMBER_LAYER_IDS = [PARKS_LAYER_ID, CAFES_LAYER_ID] as const;

export type CombinedListDemoUrls = {
	parks: string;
	cafes: string;
};

const DEMO_MAP_CENTER = config.mapViewCenter(1171479, 6848253);
const DEMO_MAP_EXTENT = config.mapViewExtent(
	1097392,
	6789091,
	1240635,
	6895797,
);

/**
 * Demo config: two feature layers with a list backed by a combined feature
 * source. The combinedVisibleLayers plugin keeps the list in sync with which
 * member layers are currently visible in the layer switcher.
 */
export function createCombinedListDemo(urls: CombinedListDemoUrls): {
	baseMapsightConfig: object;
	createOptions: CreateOptions;
} {
	const baseMapsightConfig = {
		...config.map(
			{
				osm: osm(
					"https://tile.openstreetmap.org/{z}/{x}/{y}.png",
					true,
					metaData(
						"OSM",
						'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
						true,
						false,
						true,
						"Base map",
					),
				),
				[PARKS_LAYER_ID]: interactiveFeatures(
					PARKS_LAYER_ID,
					true,
					metaData(
						"Parks",
						null,
						true,
						true,
						false,
						"Points of interest",
					),
					{
						style: "features",
						mapsightIconId: "sportanlage",
					},
				),
				[CAFES_LAYER_ID]: interactiveFeatures(
					CAFES_LAYER_ID,
					true,
					metaData(
						"Cafes",
						null,
						true,
						true,
						false,
						"Points of interest",
					),
					{
						style: "features",
						mapsightIconId: "marker",
					},
				),
			},
			config.mapView(DEMO_MAP_CENTER, DEMO_MAP_EXTENT, 14, 10, 18),
		),
		...config.features({
			[PARKS_LAYER_ID]: xhrJson(urls.parks),
			[CAFES_LAYER_ID]: xhrJson(urls.cafes),
			[LIST_COMBINED_FEATURE_SOURCE_ID]: withFilter(
				combinedFeatureSource(),
				TAG_FILTER,
			),
		}),
		...config.featureList(LIST_COMBINED_FEATURE_SOURCE_ID, true),
	};

	const createOptions: CreateOptions = {
		plugins: [
			[
				"combinedVisibleLayers",
				createCombinedVisibleLayersPlugin({
					combinedFeatureSourceId: LIST_COMBINED_FEATURE_SOURCE_ID,
					members: [...LIST_MEMBER_LAYER_IDS],
				}),
			],
		],
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
				filterControl: true,
				sortControl: true,
			},
			layerSwitcher: {
				show: {
					internal: true,
					external: true,
				},
				internal: {
					grouped: true,
				},
				external: {
					grouped: true,
					setFeatureSourceId: true,
				},
			},
		},
	};

	return {baseMapsightConfig, createOptions};
}
