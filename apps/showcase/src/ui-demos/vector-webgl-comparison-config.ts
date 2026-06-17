import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import type {FlatStyleLike} from "ol/style/flat";

import {map, mapView, mapViewCenter, mapViewExtent} from "@mapsight/ui/config";
import {features as featureSourcesConfig} from "@mapsight/ui/config";
import {
	FEATURE_SELECTIONS,
	FEATURE_SOURCES,
	MAP,
} from "@mapsight/ui/config/constants/controllers";
import {
	FEATURE_SELECTION_HIGHLIGHT,
	FEATURE_SELECTION_SELECT,
} from "@mapsight/ui/config/feature/selections";
import {features, metaData, osm} from "@mapsight/ui/config/map/layers";
import createDefaultPlugins from "@mapsight/ui/plugins/browser-defaults";
import type {CreateOptions} from "@mapsight/ui/types";
import type {Point} from "geojson";

import type {FeatureSourceData} from "@mapsight/core/lib/feature-sources/types";
import type {Feature as MapsightFeature, State} from "@mapsight/core/types";

import type {MapsightStyleFunction} from "@mapsight/lib-ol/style/styleFunction";

import {demoGeoJsonUrl} from "./demo-geojson.ts";

export const VECTOR_WEBGL_FEATURE_SOURCE_ID = "webglComparisonFeatures";
export const VECTOR_WEBGL_CANVAS_LAYER_ID = "canvasFeatures";
export const VECTOR_WEBGL_WEBGL_LAYER_ID = "webglFeatures";
export const VECTOR_WEBGL_CENTER: [number, number] = [1171479, 6848253];

type ChargingCategory = "fast" | "high" | "standard";
type ChargingState = "default" | "highlight" | "select";
type ChargingStationProperties = {
	chargingPower?: string;
	listInformation?: string;
	name?: string;
	powerKw: number;
	rendererCategory: ChargingCategory;
	state: ChargingState;
};

const styleCache = new Map<string, Style>();

function getColor(category: ChargingCategory): string {
	switch (category) {
		case "fast":
			return "#dc2626";
		case "high":
			return "#f97316";
		case "standard":
			return "#4575b4";
	}
}

function getStrokeWidth(state: ChargingState): number {
	return state === "select" ? 4 : state === "highlight" ? 3 : 1.5;
}

function getZIndex(state: ChargingState): number {
	return state === "select" ? 300 : state === "highlight" ? 200 : 1;
}

function getRadius(category: ChargingCategory): number {
	switch (category) {
		case "fast":
			return 12;
		case "high":
			return 8;
		case "standard":
			return 6;
	}
}

function parsePowerKw(value: unknown): number {
	const [raw] = String(value ?? "").match(/\d+(?:[,.]\d+)?/) ?? [];
	return raw ? Number(raw.replace(",", ".")) : 0;
}

function getChargingCategory(powerKw: number): ChargingCategory {
	if (powerKw >= 100) {
		return "fast";
	}

	if (powerKw >= 30) {
		return "high";
	}

	return "standard";
}

export async function loadChargingStationFeatureCollection(): Promise<
	FeatureSourceData & {
		features: Array<MapsightFeature & {geometry: Point}>;
	}
> {
	const response = await fetch(demoGeoJsonUrl);
	const data = (await response.json()) as FeatureSourceData & {
		features?: Array<MapsightFeature & {geometry: Point}>;
	};

	const pointFeatures = (data.features ?? []).filter(
		(feature): feature is MapsightFeature & {geometry: Point} =>
			feature.geometry.type === "Point",
	);

	return {
		type: "FeatureCollection",
		features: pointFeatures.map((feature, index) => {
			const powerKw = parsePowerKw(feature.properties?.chargingPower);
			const rendererCategory = getChargingCategory(powerKw);
			const state: ChargingState = "default";
			const properties = {
				...feature.properties,
				powerKw,
				rendererCategory,
				state,
			} satisfies MapsightFeature["properties"] &
				ChargingStationProperties;

			return {
				...feature,
				id: feature.id ?? `charging-station-${index}`,
				properties,
			};
		}),
	};
}

export const webglFlatStyle: FlatStyleLike = [
	{
		filter: ["==", ["get", "state"], "select"],
		style: {
			"circle-fill-color": [
				"match",
				["get", "rendererCategory"],
				"fast",
				"#dc2626",
				"high",
				"#f97316",
				"#4575b4",
			],
			"circle-radius": 13,
			"circle-stroke-color": "#facc15",
			"circle-stroke-width": 4,
			"z-index": 300,
		},
	},
	{
		filter: ["==", ["get", "state"], "highlight"],
		style: {
			"circle-fill-color": [
				"match",
				["get", "rendererCategory"],
				"fast",
				"#dc2626",
				"high",
				"#f97316",
				"#4575b4",
			],
			"circle-radius": 12,
			"circle-stroke-color": "#facc15",
			"circle-stroke-width": 3,
			"z-index": 200,
		},
	},
	{
		filter: ["==", ["get", "rendererCategory"], "fast"],
		style: {
			"circle-fill-color": "#dc2626",
			"circle-radius": 12,
			"circle-stroke-color": "#ffffff",
			"circle-stroke-width": 3,
			"z-index": 200,
		},
	},
	{
		filter: ["==", ["get", "rendererCategory"], "high"],
		style: {
			"circle-fill-color": "#f97316",
			"circle-radius": 8,
			"circle-stroke-color": "#ffffff",
			"circle-stroke-width": 2,
			"z-index": 20,
		},
	},
	{
		else: true,
		style: {
			"circle-fill-color": "#4575b4",
			"circle-radius": 6,
			"circle-stroke-color": "#ffffff",
			"circle-stroke-width": 1,
			"z-index": 1,
		},
	},
];

export const styleFunction: MapsightStyleFunction = (_env, feature) => {
	const category = String(
		feature.get("rendererCategory"),
	) as ChargingCategory;
	const state = String(feature.get("state")) as ChargingState;
	const cacheKey = `${category}|${state}`;
	const cached = styleCache.get(cacheKey);

	if (cached) {
		return cached;
	}

	const color = getColor(category);
	const style = new Style({
		image: new CircleStyle({
			fill: new Fill({color}),
			radius: getRadius(category),
			stroke: new Stroke({
				color: "#ffffff",
				width: getStrokeWidth(state),
			}),
		}),
		zIndex: getZIndex(state),
	});

	styleCache.set(cacheKey, style);
	return style;
};

export const baseMapsightConfig: Partial<State> = {
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
			[VECTOR_WEBGL_CANVAS_LAYER_ID]: features(
				VECTOR_WEBGL_FEATURE_SOURCE_ID,
				true,
				true,
				metaData("Canvas vector", null, true, true, false, "Renderer"),
				"features",
				{
					canAnimate: false,
					canCluster: false,
					useSelectionOverlay: false,
				},
			),
			[VECTOR_WEBGL_WEBGL_LAYER_ID]: {
				type: "WebGLVectorLayer",
				options: {
					visible: false,
					renderBuffer: 200,
					webglStyle: webglFlatStyle,
					source: {
						type: "VectorFeatureSource",
						options: {
							canAnimate: false,
							canCluster: false,
							featureSourceId: VECTOR_WEBGL_FEATURE_SOURCE_ID,
							featureSourcesControllerName: FEATURE_SOURCES,
							featureSelectionsControllerName: FEATURE_SELECTIONS,
							useSelectionOverlay: false,
						},
					},
					selections: {
						mousedown: FEATURE_SELECTION_SELECT,
						touch: FEATURE_SELECTION_SELECT,
						mouseover: FEATURE_SELECTION_HIGHLIGHT,
					},
				},
				metaData: metaData(
					"WebGL vector",
					null,
					true,
					true,
					false,
					"Renderer",
				),
			},
		},
		mapView(
			mapViewCenter(...VECTOR_WEBGL_CENTER),
			mapViewExtent(1166000, 6842500, 1177000, 6853500),
			14,
			10,
			18,
		),
	),
	...featureSourcesConfig({
		[VECTOR_WEBGL_FEATURE_SOURCE_ID]: {
			type: "local",
		},
	}),
};

export const createOptions: CreateOptions = {
	plugins: createDefaultPlugins(),
	uiState: {
		map: {
			show: true,
		},
		layerSwitcher: {
			show: {
				external: true,
				internal: true,
			},
		},
	},
};

export const controllerNames = {
	featureSelections: FEATURE_SELECTIONS,
	featureSources: FEATURE_SOURCES,
	map: MAP,
};
