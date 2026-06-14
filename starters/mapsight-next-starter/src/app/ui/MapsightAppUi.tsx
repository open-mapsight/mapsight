"use client";

import {useMemo} from "react";

import {fromLonLat} from "ol/proj";

import App from "@mapsight/ui/components/app";
import Instance from "@mapsight/ui/components/instance";
import {mapView, mapViewCenter, mapViewExtent} from "@mapsight/ui/config";
import * as config from "@mapsight/ui/config";
import {plain, xhrJson} from "@mapsight/ui/config/feature/sources";
import {
	interactiveFeatures,
	metaData,
	osm,
} from "@mapsight/ui/config/map/layers";
import createDefaultBrowserPlugins from "@mapsight/ui/plugins/browser-defaults";
import createDefaultServerPlugins from "@mapsight/ui/plugins/server-defaults";
import type {CreateOptions} from "@mapsight/ui/types";

import styleFunction from "@/generated/mapsight-vector-styles/demo";

const DEMO_CENTER = fromLonLat([10.5, 52.2]);

const baseMapsightConfig = {
	...config.map(
		{
			osm: osm(
				"https://tile.openstreetmap.org/{z}/{x}/{y}.png",
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
				metaData("Demo points", null, true, true, false, "Points"),
				{style: "features"},
			),
		},
		mapView(
			mapViewCenter(DEMO_CENTER[0]!, DEMO_CENTER[1]!),
			mapViewExtent(
				DEMO_CENTER[0]! - 40_000,
				DEMO_CENTER[1]! - 40_000,
				DEMO_CENTER[0]! + 40_000,
				DEMO_CENTER[1]! + 40_000,
			),
			12,
			10,
			18,
		),
	),
	...config.features({
		data: xhrJson("/data.geojson"),
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
			lang: "en",
			imagesUrl: "/img/",
			plugins: isClient
				? createDefaultBrowserPlugins()
				: createDefaultServerPlugins(),
			uiState: {
				map: {show: true},
				list: {show: true},
			},
		}),
		[isClient],
	);

	return (
		<main className="flex flex-col gap-4 p-4">
			<h1 className="text-xl font-semibold">Mapsight map</h1>
			<Instance
				baseMapsightConfig={baseMapsightConfig}
				createOptions={createOptions}
				styleFunction={styleFunction}
			>
				<App />
			</Instance>
		</main>
	);
}
