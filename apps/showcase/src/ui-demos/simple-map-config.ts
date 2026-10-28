import {map, mapView, mapViewCenter, mapViewExtent} from "@mapsight/ui/config";
import {metaData, osm} from "@mapsight/ui/config/map/layers";
import createDefaultPlugins from "@mapsight/ui/plugins/browser-defaults";
import type {CreateOptions} from "@mapsight/ui/types";

import {osmTileUrl} from "../osm-tile-url.ts";

export const baseMapsightConfig = {
	...map(
		{
			osm: osm(
				osmTileUrl,
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
		},
		mapView(
			mapViewCenter(1171479, 6848253),
			mapViewExtent(1097392, 6789091, 1240635, 6895797),
			14,
			10,
			18,
		),
	),
};

export const createOptions: CreateOptions = {
	plugins: createDefaultPlugins(),
	uiState: {
		map: {
			show: true,
		},
	},
};

export const noopStyleFunction = () => [];
