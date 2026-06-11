import type {ReactNode} from "react";
import {useReducer} from "react";

import App from "@mapsight/ui/components/app";
import MeasureDistanceButton from "@mapsight/ui/components/map-overlay/measure-distance-button";
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
import createDebugPlugin from "@mapsight/ui/plugins/browser/debug";
import createShareLinkPlugin from "@mapsight/ui/plugins/browser/share-position-link";
import createMeasureDistancePlugin from "@mapsight/ui/plugins/common/measure-distance";
import type {CreateOptions} from "@mapsight/ui/types";

import createNativeFullscreenPlugin from "../../features/native-fullscreen/plugin.ts";
import styleFunction from "../../generated/mapsight-vector-styles/demo.js";
import {demoGeoJsonUrl} from "../../ui-demos/demo-geojson.ts";
import {UiDemoShell} from "./ui-demo-shell.tsx";

const baseMapsightConfig = {
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
				metaData("daten", null, true, true, false, "Gruppe"),
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

const PLUGIN_NAME_SHARE_LINK = "sharePositionLink" as const;
const PLUGIN_NAME_MEASURE_DISTANCE = "measureDistance" as const;

function useToggleGroup<T extends string>(names: T[], initialActiveName?: T) {
	const createState = (activeName: T | undefined) =>
		Object.fromEntries(
			names.map((name) => [name, activeName === name]),
		) as Record<T, boolean>;
	return useReducer(
		(_: unknown, activeName: T | undefined) => createState(activeName),
		createState(initialActiveName),
	);
}

const createOptions: CreateOptions = {
	plugins: [
		...createDefaultPlugins(),
		["shareLink", createShareLinkPlugin()],
		["measureDistance", createMeasureDistancePlugin()],
		["nativeFullscreen", createNativeFullscreenPlugin()],
		["debug", createDebugPlugin()],
	],
	imagesUrl: "/img/",
	components: {
		MapOverlayTopLeft({fallback}: {fallback?: ReactNode}) {
			const [toggleStates, setActive] = useToggleGroup([
				PLUGIN_NAME_MEASURE_DISTANCE,
				PLUGIN_NAME_SHARE_LINK,
			]);

			return (
				<>
					{fallback}
					<SharePositionLinkButton
						opened={toggleStates[PLUGIN_NAME_SHARE_LINK] ?? false}
						onOpenedChange={(value) =>
							setActive(
								value ? PLUGIN_NAME_SHARE_LINK : undefined,
							)
						}
						pluginName={PLUGIN_NAME_SHARE_LINK}
					/>
					<MeasureDistanceButton
						opened={
							toggleStates[PLUGIN_NAME_MEASURE_DISTANCE] ?? false
						}
						onOpenedChange={(value) =>
							setActive(
								value
									? PLUGIN_NAME_MEASURE_DISTANCE
									: undefined,
							)
						}
						pluginName={PLUGIN_NAME_MEASURE_DISTANCE}
					/>
				</>
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
			internal: {
				grouped: true,
			},
		},
	},
};

export function CustomPage() {
	return (
		<UiDemoShell
			baseMapsightConfig={baseMapsightConfig}
			createOptions={createOptions}
			styleFunction={styleFunction}
			mergeDefaultPlugins={false}
		>
			<App />
		</UiDemoShell>
	);
}
