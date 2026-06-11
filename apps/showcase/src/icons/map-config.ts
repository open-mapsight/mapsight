import * as config from "@mapsight/ui/config";
import {FEATURE_SOURCES} from "@mapsight/ui/config/constants/controllers";
import {plain} from "@mapsight/ui/config/feature/sources";
import {
	interactiveFeatures,
	metaData,
	osm,
} from "@mapsight/ui/config/map/layers";
import createDefaultPlugins from "@mapsight/ui/plugins/browser-defaults";
import type {CreateOptions, PluginDefinition} from "@mapsight/ui/types";

import {load} from "@mapsight/core/lib/feature-sources/actions";

import {demoMapFeatures, formatMapsightIcon} from "./demo-features.ts";

export {default as styleFunction} from "../generated/mapsight-vector-styles/icon-demo";

const MAP_CENTER_PROJECTED = [1171479, 6848253] as const;
const MAP_CENTER_GEOJSON: [number, number] = [10.523575, 52.2653825];

const center = config.mapViewCenter(
	MAP_CENTER_PROJECTED[0],
	MAP_CENTER_PROJECTED[1],
);
const extent = config.mapViewExtent(1097392, 6789091, 1240635, 6895797);

export const EDITOR_PREVIEW_FEATURE_ID = "editor-preview";
export const EDITOR_PREVIEW_COORDINATES = MAP_CENTER_GEOJSON;

export function buildEditorPreviewFeature(mapsightIconId: string) {
	return {
		type: "Feature" as const,
		id: EDITOR_PREVIEW_FEATURE_ID,
		properties: {
			title: "Editor preview",
			mapsightIconId,
		},
		geometry: {
			type: "Point" as const,
			coordinates: EDITOR_PREVIEW_COORDINATES,
		},
	};
}

export function formatEditorPreviewFeatureJson(mapsightIconId: string): string {
	const [lon, lat] = EDITOR_PREVIEW_COORDINATES;

	return `{
  "type": "Feature",
  "properties": {
    "mapsightIconId": ${JSON.stringify(mapsightIconId)}
  },
  "geometry": {
    "type": "Point",
    "coordinates": [${lon}, ${lat}]
  }
}`;
}

function buildDemoFeatures() {
	return demoMapFeatures.map((item) => ({
		type: "Feature" as const,
		id: item.id,
		properties: {
			title: item.title,
			mapsightIconId: item.mapsightIconId,
		},
		geometry: {
			type: "Point" as const,
			coordinates: item.coordinates,
		},
	}));
}

export function createBaseMapsightConfig(options: {plainMap?: boolean} = {}) {
	const features = [...buildDemoFeatures(), buildEditorPreviewFeature("")];
	const dataLayer = interactiveFeatures(
		"data",
		true,
		metaData("Runtime icons", null, true, true, false, "Demo"),
		"features",
	);
	const mapView = config.mapView(center, extent, 14, 10, 18);
	const featureSources = config.features({
		data: {
			...plain(),
			data: {
				type: "FeatureCollection",
				features,
			},
			lastUpdate: Date.now(),
			lastActionType: null,
		},
	});

	if (options.plainMap) {
		return {
			...config.map({data: dataLayer}, mapView),
			...featureSources,
		};
	}

	return {
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
						"Karte",
					),
				),
				data: dataLayer,
			},
			mapView,
		),
		...featureSources,
	};
}

const loadDemoFeaturesPlugin: PluginDefinition = [
	"loadDemoFeatures",
	{
		afterInit(context) {
			context.store?.dispatch(load(FEATURE_SOURCES, "data"));
		},
	},
];

export const createOptions: CreateOptions = {
	plugins: [...createDefaultPlugins(), loadDemoFeaturesPlugin],
	uiState: {
		map: {
			show: true,
		},
	},
};

export const DEFAULT_ICON_BACKGROUND = "#ffffff";

export function buildMapsightIcon(input: {
	pictogram: string;
	label: string;
	background: string;
	foregroundOverride: string | null;
}): string {
	const hasPictogram = Boolean(input.pictogram);
	const hasLabel = Boolean(input.label.trim());
	const usesDefaultBackground = input.background === DEFAULT_ICON_BACKGROUND;
	const hasExplicitForeground = input.foregroundOverride !== null;

	if (usesDefaultBackground && !hasExplicitForeground) {
		return formatMapsightIcon({
			pictogram: hasPictogram ? input.pictogram : undefined,
			label: hasLabel ? input.label : undefined,
		});
	}

	const colors: {background: string; foreground?: string} = {
		background: input.background,
	};
	if (input.foregroundOverride !== null) {
		colors.foreground = input.foregroundOverride;
	}

	return formatMapsightIcon({
		pictogram: hasPictogram ? input.pictogram : undefined,
		label: hasLabel ? input.label : undefined,
		colors,
	});
}
