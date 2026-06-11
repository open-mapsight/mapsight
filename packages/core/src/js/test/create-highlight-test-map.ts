import Feature from "ol/Feature";
import type OlMap from "ol/Map";
import MapBrowserEvent from "ol/MapBrowserEvent";
import Point from "ol/geom/Point";
import type BaseLayer from "ol/layer/Base";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Style from "ol/style/Style";

import {createMapsightStore} from "@/index";
import {FeatureSelectionsController} from "@/lib/feature-selections/controller";
import {setData} from "@/lib/feature-sources/actions";
import {FeatureSourcesController} from "@/lib/feature-sources/controller";
import {MapController} from "@/lib/map/controller";
import {getIdForLayer} from "@/lib/map/lib/tagLayer";
import {ProjectionsController} from "@/lib/projections/controller";
import type {EnhancedStore} from "@/types";

export const HIGHLIGHT_TEST_FEATURE_ID = "poi-1";
export const HIGHLIGHT_TEST_COORD = [0, 0] as [number, number];
export const HIGHLIGHT_TEST_MAP_SIZE: [number, number] = [400, 400];

export type HighlightTestMapContext = {
	store: EnhancedStore;
	mapController: MapController;
	map: OlMap;
	feature: Feature;
	layer: BaseLayer;
	target: HTMLDivElement;
};

type HitMode = "feature" | "empty";

export type CreateHighlightTestMapOptions = {
	/** Stub OL hit detection (fast, deterministic). Default: true in vitest. */
	stubHits?: boolean;
	getHitMode?: () => HitMode;
	/** Mount target; creates and appends a div when omitted. */
	mountTarget?: HTMLElement;
};

/**
 * Minimal mapsight runtime for hover/highlight integration tests.
 * In Node/vitest, hit detection is stubbed by default — use Playwright for real OL hits.
 */
export function createHighlightTestMap(
	options: CreateHighlightTestMapOptions = {},
): HighlightTestMapContext {
	const {
		stubHits = typeof process !== "undefined" &&
			process.env.VITEST === "true",
		getHitMode = () => "empty",
		mountTarget,
	} = options;

	const mapController = new MapController("map");
	mapController.setStyleFunction(() => [
		new Style({
			image: new CircleStyle({
				radius: 8,
				fill: new Fill({color: "red"}),
			}),
		}),
	]);

	const controllers = {
		projections: new ProjectionsController("projections"),
		map: mapController,
		featureSources: new FeatureSourcesController("featureSources"),
		featureSelections: new FeatureSelectionsController("featureSelections"),
	};

	const initialState = {
		map: {
			view: {
				center: HIGHLIGHT_TEST_COORD,
				zoom: 10,
				minZoom: 0,
				maxZoom: 20,
			},
			size: HIGHLIGHT_TEST_MAP_SIZE,
			layers: {
				pois: {
					type: "VectorLayer",
					options: {
						visible: true,
						style: "features",
						source: {
							type: "VectorFeatureSource",
							options: {
								featureSourceId: "pois",
								featureSourcesControllerName: "featureSources",
								featureSelectionsControllerName:
									"featureSelections",
								canCluster: false,
								canAnimate: false,
							},
						},
						selections: {
							mouseover: "highlight",
						},
					},
				},
			},
			featureInteractions: {
				mouseover: {
					selection: "mouseover",
					options: {
						main: true,
						auxiliary: false,
						secondary: false,
						fourth: false,
						fifth: false,
						cursor: "pointer",
						deselectUncontrolled: null,
						hitTolerance: 5,
					},
				},
				mousedown: {
					selection: "mousedown",
					options: {
						main: true,
						auxiliary: false,
						secondary: false,
						fourth: false,
						fifth: false,
						deselectUncontrolled: null,
						hitTolerance: 5,
					},
				},
				touch: {
					selection: "touch",
					options: {
						deselectUncontrolled: null,
						hitTolerance: 5,
					},
				},
			},
		},
		featureSelections: {
			highlight: {max: 1, features: []},
		},
		featureSources: {
			pois: {
				type: "local",
				data: null,
				lastUpdate: null,
				lastActionType: null,
			},
		},
	};

	const store = createMapsightStore(controllers, {}, initialState);

	const target = mountTarget ?? document.createElement("div");
	if (!mountTarget) {
		target.style.width = `${HIGHLIGHT_TEST_MAP_SIZE[0]}px`;
		target.style.height = `${HIGHLIGHT_TEST_MAP_SIZE[1]}px`;
		document.body.appendChild(target);
	}
	mapController.mount(target);

	const map = mapController.getMap();
	if (!map) {
		throw new Error("Map was not created");
	}

	map.setSize(HIGHLIGHT_TEST_MAP_SIZE);

	const layer = findLayerById(map, "pois");

	let feature: Feature;
	if (stubHits) {
		feature = new Feature({
			geometry: new Point(HIGHLIGHT_TEST_COORD),
		});
		feature.setId(HIGHLIGHT_TEST_FEATURE_ID);
		stubFeatureHitDetection(map, layer, feature, getHitMode);
	} else {
		store.dispatch(
			setData("featureSources", "pois", {
				type: "FeatureCollection",
				features: [
					{
						id: HIGHLIGHT_TEST_FEATURE_ID,
						type: "Feature",
						properties: {},
						geometry: {
							type: "Point",
							coordinates: HIGHLIGHT_TEST_COORD,
						},
					},
				],
			}),
		);
		map.renderSync();
		const source = (
			layer as {getSource: () => {getFeatures: () => Array<Feature>}}
		).getSource();
		const loadedFeature = source
			.getFeatures()
			.find((f) => String(f.getId()) === HIGHLIGHT_TEST_FEATURE_ID);
		if (!loadedFeature) {
			throw new Error(
				"Test feature was not loaded into the vector source",
			);
		}
		feature = loadedFeature;
	}

	return {store, mapController, map, feature, layer, target};
}

export function centerPixel(map: OlMap): [number, number] {
	const size = map.getSize();
	if (!size) {
		throw new Error("Map size is not set");
	}
	return [size[0] / 2, size[1] / 2];
}

export function dispatchPointerMoveAtPixel(
	map: OlMap,
	pixel: [number, number],
) {
	const [x, y] = pixel;
	const originalEvent = new MouseEvent("mousemove", {
		clientX: x,
		clientY: y,
		bubbles: true,
	});
	const event = new MapBrowserEvent("pointermove", map, originalEvent, false);
	event.pixel = pixel;
	map.dispatchEvent(event);
}

export function stubFeatureHitDetection(
	map: OlMap,
	layer: BaseLayer,
	feature: Feature,
	getHitMode: () => HitMode,
) {
	map.forEachFeatureAtPixel = (pixel, callback, options) => {
		if (getHitMode() === "feature") {
			return callback(feature, layer, pixel);
		}
		return undefined;
	};
}

export function getHighlightFeatures(store: EnhancedStore): string[] {
	return store.getState().featureSelections?.highlight?.features ?? [];
}

function findLayerById(map: OlMap, layerId: string) {
	for (const layer of map.getLayers().getArray()) {
		if ("getLayers" in layer && typeof layer.getLayers === "function") {
			for (const child of layer.getLayers().getArray()) {
				if (getIdForLayer(child) === layerId) {
					return child;
				}
			}
		} else if (getIdForLayer(layer) === layerId) {
			return layer;
		}
	}
	throw new Error(`Layer ${layerId} was not found on the map`);
}
