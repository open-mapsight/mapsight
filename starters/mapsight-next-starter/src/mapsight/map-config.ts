import {fromLonLat} from "ol/proj";

import * as config from "@mapsight/ui/config";
import {mapView, mapViewCenter, mapViewExtent} from "@mapsight/ui/config";
import {plain, xhrJson} from "@mapsight/ui/config/feature/sources";
import {
	interactiveFeatures,
	metaData,
	osm,
} from "@mapsight/ui/config/map/layers";

const DEMO_CENTER = fromLonLat([10.5, 52.2]);

export const baseMapsightConfig = {
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
