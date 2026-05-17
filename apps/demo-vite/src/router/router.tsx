import {Fragment} from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter, Link, Route, Routes} from "react-router-dom";

import Instance from "@mapsight/ui/components/instance";
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

import styleFunction from "../generated/mapsight-vector-styles/demo";
import RoutedApp from "./components/RoutedApp";

const bmc = {
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
			config.mapViewCenter(1171479, 6848253), // x, y ^= 52.2653825, 10.523575 (lat, lon)
			config.mapViewExtent(1097392, 6789091, 1240635, 6895797), // minx, miny, maxx, maxy http://bboxfinder.com/#51.938934,9.858041,52.526000,11.144814
			14, // z
			10, // minZoom
			18, // maxZoom
		),
	),
	...config.features({
		data: xhrJson(new URL("../data.geojson", import.meta.url).toString()),
		userGeolocation: plain(),
		searchResult: plain(),
	}),
	...config.featureList("data", true),
};

const createOptions: CreateOptions = {
	plugins: [
		...createDefaultPlugins(),
		["shareLink", createShareLinkPlugin()],
	],
	imagesUrl: "/public/img/",
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

const root = createRoot(document.querySelector("#root")!);
root.render(
	<BrowserRouter basename="router">
		<Instance
			baseMapsightConfig={bmc}
			createOptions={createOptions}
			styleFunction={styleFunction}
		>
			<nav className="border-b">
				<ul className="flex flex-row">
					<li>
						<Link className="mx-2 px-2 py-1 rounded" to="example-1">
							Example 1
						</Link>
					</li>
					<li>
						<Link className="mx-2 px-2 py-1 rounded" to="example-2">
							Example 2
						</Link>
					</li>
				</ul>
			</nav>

			<Routes>
				<Route path="/" element={<span>Home</span>} />
				<Route path="example-1" element={<span>Beispiel 1</span>} />
				<Route path="example-2" element={<span>Beispiel 2</span>} />
			</Routes>

			<Routes>
				<Route path="*" element={<RoutedApp />} />
			</Routes>
		</Instance>
	</BrowserRouter>,
);
