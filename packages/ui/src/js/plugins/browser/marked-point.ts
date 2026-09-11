import type {Coordinate} from "ol/coordinate";
import {toLonLat} from "ol/proj";

import {mergeAll} from "@mapsight/core/lib/base/actions";
import {selectExclusively} from "@mapsight/core/lib/feature-selections/actions";
import {
	removeAllFeatures,
	setData,
} from "@mapsight/core/lib/feature-sources/actions";
import type {EnhancedStore} from "@mapsight/core/types";

import {
	FEATURE_SELECTIONS,
	FEATURE_SOURCES,
	MAP,
} from "../../config/constants/controllers";
import {FEATURE_SELECTION_SELECT} from "../../config/feature/selections";
import {features, metaData} from "../../config/map/layers";
import {
	formatCoordinateSpellings,
	formatLonLat,
} from "../../helpers/coordinates";
import type {MapsightUiFeature, MapsightUiFeatureId} from "../../types";

export const DEFAULT_MARKED_POINT_PLUGIN = "sharePositionLink";
export const DEFAULT_MARKED_POINT_FEATURE_ID = "link-marker";
export const MARKED_POINT_PROPERTY = "mapsightMarkedPoint";

export function isMarkedPointFeature(feature: {
	id?: unknown;
	properties?: {id?: unknown; mapsightMarkedPoint?: unknown} | null;
}): boolean {
	if (feature.properties?.mapsightMarkedPoint === true) {
		return true;
	}
	const id = feature.id ?? feature.properties?.id;
	return id === DEFAULT_MARKED_POINT_FEATURE_ID;
}
export const CONTEXT_MENU_DRAG_THRESHOLD_PX = 5;

export function markedPointSourceId(pluginName: string): string {
	return `${pluginName}_featureSource`;
}

export function markedPointLayerId(pluginName: string): string {
	return `${pluginName}_drawLayer`;
}

/** @deprecated Import from `@mapsight/ui/helpers/coordinates`. */
export {
	formatCoordinateSpellings,
	formatLonLat,
} from "../../helpers/coordinates";
export type {CoordinateSpellings} from "../../helpers/coordinates";

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

/** HTML block for the selected-feature details, not the list subtitle. */
export function markedPointCoordsHtml(lat: number, lon: number): string {
	const spellings = formatCoordinateSpellings(lat, lon);
	const lines = [spellings.decimal, spellings.decimalDegrees, spellings.dms]
		.map(
			(line) =>
				`<div class="ms3-marked-point-coords__line">${escapeHtml(line)}</div>`,
		)
		.join("");
	return `<div class="ms3-marked-point-coords">${lines}</div>`;
}

export function eventPointIsOverMap(
	point: {x: number; y: number},
	mapTarget: Element | null,
): boolean {
	if (!mapTarget) {
		return false;
	}
	const rect = mapTarget.getBoundingClientRect();
	return (
		point.x >= rect.left &&
		point.x <= rect.right &&
		point.y >= rect.top &&
		point.y <= rect.bottom
	);
}

export function eventTargetIsInMapMenu(
	eventTarget: EventTarget | null,
): boolean {
	return (
		eventTarget instanceof Element &&
		Boolean(
			eventTarget.closest(
				".ms3-map-point-menu, .ms3-map-point-menu__popover",
			),
		)
	);
}

const INTERACTIVE_OVERLAY_SELECTOR = [
	"a",
	"button",
	"input",
	"select",
	"textarea",
	"summary",
	"[role='button']",
	"[role='link']",
	"[role='menuitem']",
	"[role='tab']",
	"[role='switch']",
].join(", ");

/** Overlay chrome over the map (zoom, search, layers) is not a map click. */
export function eventTargetIsInteractiveOverlay(
	eventTarget: EventTarget | null,
): boolean {
	if (
		!(eventTarget instanceof Element) ||
		eventTargetIsInMapMenu(eventTarget)
	) {
		return false;
	}
	return eventTarget.closest(INTERACTIVE_OVERLAY_SELECTOR) != null;
}

export function lonLatFromMapCoordinate(
	coordinate: Coordinate,
): {lon: number; lat: number} | null {
	const [lon, lat] = toLonLat(coordinate);
	if (
		typeof lon !== "number" ||
		typeof lat !== "number" ||
		!Number.isFinite(lon) ||
		!Number.isFinite(lat)
	) {
		return null;
	}
	return {lon, lat};
}

export function shouldOpenMapContextMenu(
	pointerDown: {x: number; y: number} | null,
	point: {x: number; y: number},
	thresholdPx = CONTEXT_MENU_DRAG_THRESHOLD_PX,
): boolean {
	if (!pointerDown) {
		return true;
	}
	const dx = point.x - pointerDown.x;
	const dy = point.y - pointerDown.y;
	return Math.hypot(dx, dy) <= thresholdPx;
}

export function isMapContextMenuKeyboardEvent(event: {
	key: string;
	shiftKey: boolean;
}): boolean {
	return (
		event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey)
	);
}

export function eventTargetIsInMap(
	eventTarget: EventTarget | null,
	mapTarget: Element | null,
): boolean {
	return Boolean(
		mapTarget &&
		eventTarget instanceof Node &&
		mapTarget.contains(eventTarget),
	);
}

export type MarkedPointProps = {
	id?: MapsightUiFeatureId;
	name?: string;
	iconId?: string;
	listInformation?: string | null;
	description?: string | null;
};

export function createMarkedPointFeature(
	lon: number,
	lat: number,
	{
		id = DEFAULT_MARKED_POINT_FEATURE_ID,
		name,
		iconId = "marker",
		listInformation,
		description,
	}: MarkedPointProps = {},
): MapsightUiFeature {
	const label = name ?? formatLonLat(lat, lon);
	const place = listInformation?.trim();
	return {
		type: "Feature",
		id,
		geometry: {
			type: "Point",
			coordinates: [lon, lat],
		},
		properties: {
			id,
			name: label,
			mapsightIconId: iconId,
			mapsightMarkedPoint: true,
			...(place ? {listInformation: place} : {}),
			description: description ?? markedPointCoordsHtml(lat, lon),
		},
	} as unknown as MapsightUiFeature;
}

export type EnsureMarkedPointLayerOptions = {
	pluginName?: string;
	mapControllerName?: string;
	featureSourcesControllerName?: string;
	featureSelectionsControllerName?: string;
	markerName?: string;
	markerStyle?: string;
	markerLayerGroup?: string | null;
	zIndex?: number;
};

export function ensureMarkedPointLayerAction(
	options: EnsureMarkedPointLayerOptions = {},
) {
	const pluginName = options.pluginName ?? DEFAULT_MARKED_POINT_PLUGIN;
	const mapControllerName = options.mapControllerName ?? MAP;
	const featureSourcesControllerName =
		options.featureSourcesControllerName ?? FEATURE_SOURCES;
	const featureSelectionsControllerName =
		options.featureSelectionsControllerName ?? FEATURE_SELECTIONS;
	const sourceId = markedPointSourceId(pluginName);
	const layerId = markedPointLayerId(pluginName);
	const title = options.markerName ?? "Marker";

	const layer = features(
		sourceId,
		true,
		true,
		metaData(title, null, false, false, false, options.markerLayerGroup),
		options.markerStyle ?? "features",
		{
			featureSourcesControllerName,
			featureSelectionsControllerName,
		},
	);
	const layerOptions = {
		...(layer.options ?? {}),
	} as Record<string, unknown>;
	if (options.markerStyle === undefined) {
		delete layerOptions.style;
	} else {
		layerOptions.style = options.markerStyle;
	}
	if (options.zIndex !== undefined) {
		layerOptions.zIndex = options.zIndex;
	}

	return mergeAll({
		[mapControllerName]: {
			layers: {
				[layerId]: {
					...layer,
					options: layerOptions,
				},
			},
		},
		[featureSourcesControllerName]: {
			[sourceId]: {
				enableHistory: false,
			},
		},
	});
}

export type SetMarkedPointOptions = EnsureMarkedPointLayerOptions & {
	lon: number;
	lat: number;
	featureId?: MapsightUiFeatureId;
	featureName?: string;
	listInformation?: string | null;
	description?: string | null;
	iconId?: string;
	select?: boolean;
	featureSelectionsControllerName?: string;
};

export function markedPointCollection(feature: MapsightUiFeature): {
	type: "FeatureCollection";
	features: MapsightUiFeature[];
} {
	return {
		type: "FeatureCollection",
		features: [feature],
	};
}

/** Dispatch ensure-layer, replace the single point, optionally select it. */
export function setMarkedPoint(options: SetMarkedPointOptions) {
	return (dispatch: EnhancedStore["dispatch"]) => {
		const pluginName = options.pluginName ?? DEFAULT_MARKED_POINT_PLUGIN;
		const featureSourcesControllerName =
			options.featureSourcesControllerName ?? FEATURE_SOURCES;
		const featureSelectionsControllerName =
			options.featureSelectionsControllerName ?? FEATURE_SELECTIONS;
		const feature = createMarkedPointFeature(options.lon, options.lat, {
			id: options.featureId,
			name: options.featureName,
			iconId: options.iconId,
			listInformation: options.listInformation,
			description: options.description,
		});

		dispatch(ensureMarkedPointLayerAction(options));
		dispatch(
			setData(
				featureSourcesControllerName,
				markedPointSourceId(pluginName),
				markedPointCollection(feature),
			),
		);
		if (options.select !== false) {
			dispatch(
				selectExclusively(
					featureSelectionsControllerName,
					FEATURE_SELECTION_SELECT,
					feature.id,
				),
			);
		}
		return feature;
	};
}

export type ClearMarkedPointOptions = {
	pluginName?: string;
	featureSourcesControllerName?: string;
};

export function clearMarkedPoint(options: ClearMarkedPointOptions = {}) {
	return (dispatch: EnhancedStore["dispatch"]) => {
		const pluginName = options.pluginName ?? DEFAULT_MARKED_POINT_PLUGIN;
		const featureSourcesControllerName =
			options.featureSourcesControllerName ?? FEATURE_SOURCES;
		dispatch(
			removeAllFeatures(
				featureSourcesControllerName,
				markedPointSourceId(pluginName),
			),
		);
	};
}
