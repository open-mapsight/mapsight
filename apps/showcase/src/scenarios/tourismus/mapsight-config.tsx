import {
	FeaturePlaceActions,
	type FeaturePlaceActionsProps,
} from "@mapsight/ui/components/place-actions";
import * as config from "@mapsight/ui/config";
import {TAG_FILTER, withFilter} from "@mapsight/ui/config/feature/sources";
import {
	interactiveFeatures,
	metaData,
	osm,
} from "@mapsight/ui/config/map/layers";
import createDefaultPlugins from "@mapsight/ui/plugins/browser-defaults";
import type {CreateOptions} from "@mapsight/ui/types";

import {en, language, places} from "./content.ts";

export {default as styleFunction} from "../../generated/mapsight-vector-styles/demo";

function TourismPlaceActions({feature}: FeaturePlaceActionsProps) {
	return (
		<FeaturePlaceActions
			feature={feature}
			config={{
				copyCoords: false,
				impliedFeatureSourceIds: ["places"],
				navigation: {
					targets: [
						"geo",
						{
							id: "osm",
							label: en
								? "OpenStreetMap (external website)"
								: "OpenStreetMap (externe Website)",
							href: ({lat, lon}) =>
								lat == null || lon == null
									? null
									: `https://www.openstreetmap.org/directions?to=${lat}%2C${lon}`,
						},
					],
				},
			}}
		/>
	);
}

export const baseMapsightConfig = {
	...config.map(
		{
			// This self-contained host always uses the existing same-origin tile proxy.
			osm: osm(
				"/tiles/osm/{z}/{x}/{y}.png",
				true,
				metaData(
					"OpenStreetMap",
					'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
					true,
					false,
					true,
				),
			),
			places: interactiveFeatures(
				"places",
				true,
				metaData(
					en ? "Selected places · OSM" : "Ausgewählte Orte · OSM",
				),
				{style: "features", mapsightIconId: "museum"},
				{
					clusterFeatures: true,
					clusterFeaturesOptions: {
						distance: 30,
						spreadDistance: 7,
						spreadRadius: 30,
						spreadFeaturesIfCloseToMinResolution: true,
					},
				},
			),
		},
		config.mapView(
			config.mapViewCenter(1171582, 6848092),
			config.mapViewExtent(1097392, 6789091, 1240635, 6895797),
			14.5,
			10,
			18,
		),
	),
	...config.features({
		places: withFilter({type: "local", data: places}, TAG_FILTER),
	}),
	...config.featureList("places", true),
};

export const createOptions: CreateOptions = {
	imagesUrl: "/img/",
	lang: language,
	components: {FeaturePlaceActions: TourismPlaceActions},
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
		featureSelectionInfo: {stickyHeader: false},
		list: {
			show: true,
			selectOnClick: "mainAndIcon",
			deselectOnClick: false,
			selectionBehavior: {desktop: null, mobile: null},
			itemsPerPage: 8,
			paginationControl: false,
			tagSwitcherControl: false,
			layerSwitcherControl: false,
			integratedList: false,
			detailsInList: false,
			filterControl: true,
			sortControl: true,
			renderGroupAs: "",
		},
		tagSwitcher: {show: true, featureSourceId: "places", sortTags: false},
		places: {
			// List distance origins use longitude/latitude, unlike the projected map view.
			start: {
				title: en
					? "Central starting point (example)"
					: "Startpunkt Mitte (Beispiel)",
				x: 10.5245,
				y: 52.2645,
			},
			park: {
				title: en
					? "Park starting point (example)"
					: "Startpunkt Park (Beispiel)",
				x: 10.53248,
				y: 52.26716,
			},
		},
		listDefaultSortingByFeatureSource: {places: {place: "start"}},
	},
};
