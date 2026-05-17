import {createRoot} from "react-dom/client";

import Instance from "@mapsight/ui/components/instance";
import Map from "@mapsight/ui/components/map";
import MapWrapper from "@mapsight/ui/components/map-wrapper";
import {map, mapView, mapViewCenter, mapViewExtent} from "@mapsight/ui/config";
import {metaData, osm} from "@mapsight/ui/config/map/layers";
import createDefaultPlugins from "@mapsight/ui/plugins/browser-defaults";

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
		},
		mapView(
			mapViewCenter(1171479, 6848253), // x, y ^= 52.2653825, 10.523575 (lat, lon)
			mapViewExtent(1097392, 6789091, 1240635, 6895797), // minx, miny, maxx, maxy http://bboxfinder.com/#51.938934,9.858041,52.526000,11.144814
			14, // z
			10, // minZoom
			18, // maxZoom
		),
	),
};

const createOptions = {
	plugins: createDefaultPlugins(),
	uiState: {
		map: {
			show: true,
		},
	},
};

const noopStyleFunction = () => [];

const root = createRoot(document.querySelector("#root")!);
root.render(
	<Instance
		baseMapsightConfig={bmc}
		createOptions={createOptions}
		styleFunction={noopStyleFunction}
	>
		<MapWrapper>
			<Map />
		</MapWrapper>
	</Instance>,
);
