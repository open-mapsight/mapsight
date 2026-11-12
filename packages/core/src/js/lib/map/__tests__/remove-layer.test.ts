import type OlMap from "ol/Map";

import {describe, expect, it} from "vitest";

import {set, unset} from "@/lib/base/actions";
import type {FutureFlags} from "@/lib/base/future";
import {ACTION_REMOVE_KEY} from "@/lib/base/reducer";
import {removeFeatureSource, setData} from "@/lib/feature-sources/actions";
import {
	addInteractionSelection,
	removeInteractionSelection,
	removeLayer,
} from "@/lib/map/actions";
import {getIdForLayer} from "@/lib/map/lib/tagLayer";
import {
	layerAttributionsSelector,
	layerIdsExternalSwitcherSelector,
	layerIdsIntegratedSwitcherSelector,
	layersWithLegendsSelector,
	layersWithMiniLegendsSelector,
	reduceLayersToAttributions,
	reduceLayersToLegends,
	reduceToLayersWithLegends,
	reduceToLayersWithMiniLegends,
	visibleLayersWithLegendsSelector,
} from "@/lib/map/selectors";
import type {LayerState, MapState} from "@/lib/map/types";
import {createHighlightTestMap} from "@/test/create-highlight-test-map";
import type {EnhancedStore} from "@/types";

function layersOf(store: EnhancedStore) {
	return (store.getState().map as MapState).layers;
}

function olLayerIds(map: OlMap) {
	return map
		.getAllLayers()
		.map((layer) => getIdForLayer(layer))
		.filter((id): id is string => id !== null && id !== undefined);
}

const extraLayer = (
	metaData: LayerState["metaData"] = {},
	visible = true,
): LayerState => ({
	type: "VectorLayer",
	metaData,
	options: {visible, source: {type: "VectorSource", options: {}}},
});

describe("removeLayer", () => {
	it("creates a removeKey action for the layer", () => {
		expect(removeLayer("map", "extra")).toEqual({
			type: ACTION_REMOVE_KEY,
			meta: {path: ["map", "layers", "extra"]},
		});
	});

	it("deletes the key and removes the OpenLayers layer", () => {
		const {store, map} = createHighlightTestMap();
		store.dispatch(set(["map", "layers", "extra"], extraLayer()));
		expect(olLayerIds(map)).toEqual(
			expect.arrayContaining(["pois", "extra"]),
		);

		store.dispatch(removeLayer("map", "extra"));

		expect(Object.keys(layersOf(store))).toEqual(["pois"]);
		expect("extra" in layersOf(store)).toBe(false);
		expect(olLayerIds(map)).toEqual(["pois"]);
	});

	it("keeps the other layers by reference and later actions working", () => {
		const {store, map} = createHighlightTestMap();
		store.dispatch(set(["map", "layers", "extra"], extraLayer()));
		const poisBefore = layersOf(store).pois;

		store.dispatch(removeLayer("map", "extra"));

		expect(layersOf(store).pois).toBe(poisBefore);
		expect(() => {
			store.dispatch(
				set(["map", "layers", "pois", "options", "visible"], false),
			);
			store.dispatch(set(["map", "layers", "again"], extraLayer()));
			store.dispatch(removeLayer("map", "again"));
		}).not.toThrow();
		expect(olLayerIds(map)).toEqual(["pois"]);
	});

	it("leaves the state reference unchanged for unknown layer ids", () => {
		const {store} = createHighlightTestMap();
		const before = store.getState();

		store.dispatch(removeLayer("map", "does-not-exist"));

		expect(store.getState()).toBe(before);
	});

	it("hides layers that depend on the removed layer", () => {
		const {store} = createHighlightTestMap();
		store.dispatch(
			set(
				["map", "layers", "companion"],
				extraLayer({visibleWhenLayerIds: ["pois"]}, false),
			),
		);
		expect(layersOf(store).companion?.options?.visible).toBe(true);

		store.dispatch(removeLayer("map", "pois"));

		expect("pois" in layersOf(store)).toBe(false);
		expect(layersOf(store).companion?.options?.visible).toBe(false);
	});

	it("keeps the layer's feature source and does not touch selections", () => {
		const {store} = createHighlightTestMap();
		const state = store.getState();

		store.dispatch(removeLayer("map", "pois"));

		const next = store.getState();
		expect(next.featureSources).toBe(state.featureSources);
		expect(next.featureSelections).toBe(state.featureSelections);
	});
});

describe("unset of a layer", () => {
	it("keeps the key with an undefined value and no longer throws", () => {
		const {store, map} = createHighlightTestMap();
		store.dispatch(set(["map", "layers", "extra"], extraLayer()));

		expect(() =>
			store.dispatch(unset(["map", "layers", "extra"])),
		).not.toThrow();

		expect("extra" in layersOf(store)).toBe(true);
		expect(layersOf(store).extra).toBeUndefined();
		expect(olLayerIds(map)).toEqual(["pois"]);
		expect(() =>
			store.dispatch(
				set(["map", "layers", "pois", "options", "visible"], false),
			),
		).not.toThrow();
	});
});

describe("removeFeatureSource with a layer bound to the source", () => {
	it("does not throw, also for later data updates of the removed source", () => {
		const {store, map} = createHighlightTestMap();

		expect(() => {
			store.dispatch(removeFeatureSource("featureSources", "pois"));
			store.dispatch(
				setData("featureSources", "pois", {
					type: "FeatureCollection",
					features: [],
				}),
			);
			store.dispatch(
				set(["map", "layers", "pois", "options", "visible"], false),
			);
		}).not.toThrow();

		expect(store.getState().featureSources).toEqual({});
		expect(olLayerIds(map)).toEqual(["pois"]);
	});
});

describe("layer selectors with undefined entries", () => {
	const layers = {
		gone: undefined,
		legend: {
			type: "TileLayer",
			metaData: {
				legend: "legend.png",
				miniLegend: "mini.png",
				attribution: "© data",
				visibleInLayerSwitcher: true,
				visibleInExternalLayerSwitcher: true,
			},
			options: {visible: true},
		},
		plain: {type: "TileLayer", options: {visible: true}},
	} as unknown as MapState["layers"];

	it("skips them when reducing legends and attributions", () => {
		expect(Object.keys(reduceLayersToLegends(layers))).toEqual(["legend"]);
		expect(Object.keys(reduceToLayersWithLegends(layers))).toEqual([
			"legend",
		]);
		expect(Object.keys(reduceToLayersWithMiniLegends(layers))).toEqual([
			"legend",
		]);
		expect(reduceLayersToAttributions(layers)).toEqual({
			legend: "© data",
		});
	});

	it("skips them in the memoized selectors", () => {
		const state = {layers, size: [0, 0]} as unknown as MapState;

		expect(Object.keys(layersWithLegendsSelector(state))).toEqual([
			"legend",
		]);
		expect(Object.keys(layersWithMiniLegendsSelector(state))).toEqual([
			"legend",
		]);
		expect(
			Object.keys(
				visibleLayersWithLegendsSelector({
					...state,
					visibleLayers: ["gone", "legend"],
				}),
			),
		).toEqual(["legend"]);
		expect(layerAttributionsSelector(state)).toEqual({legend: "© data"});
		expect(layerIdsIntegratedSwitcherSelector(state)).toEqual(["legend"]);
		expect(layerIdsExternalSwitcherSelector(state)).toEqual(["legend"]);
	});
});

describe("unset with the unsetRemovesKey future flag", () => {
	const future: FutureFlags = {v15_unsetRemovesKey: true};

	it("removes a layer like removeLayer", () => {
		const viaUnset = createHighlightTestMap({future});
		const viaRemove = createHighlightTestMap({future});
		for (const {store} of [viaUnset, viaRemove]) {
			store.dispatch(set(["map", "layers", "extra"], extraLayer()));
		}
		const poisBefore = layersOf(viaUnset.store).pois;

		viaUnset.store.dispatch(unset(["map", "layers", "extra"]));
		viaRemove.store.dispatch(removeLayer("map", "extra"));

		expect("extra" in layersOf(viaUnset.store)).toBe(false);
		expect(Object.keys(layersOf(viaUnset.store))).toEqual(["pois"]);
		expect(layersOf(viaUnset.store).pois).toBe(poisBefore);
		expect(layersOf(viaUnset.store)).toEqual(layersOf(viaRemove.store));
		expect(olLayerIds(viaUnset.map)).toEqual(["pois"]);
		expect(olLayerIds(viaUnset.map)).toEqual(olLayerIds(viaRemove.map));
	});

	it("keeps later actions working and lets the layer id be used again", () => {
		const {store, map} = createHighlightTestMap({future});
		store.dispatch(set(["map", "layers", "extra"], extraLayer()));
		store.dispatch(unset(["map", "layers", "extra"]));

		expect(() => {
			store.dispatch(
				set(["map", "layers", "pois", "options", "visible"], false),
			);
			store.dispatch(set(["map", "layers", "extra"], extraLayer()));
		}).not.toThrow();

		expect(olLayerIds(map)).toEqual(
			expect.arrayContaining(["pois", "extra"]),
		);
	});

	it("does nothing for a layer that does not exist", () => {
		const {store} = createHighlightTestMap({future});
		const state = store.getState();

		store.dispatch(unset(["map", "layers", "missing"]));

		expect(store.getState()).toBe(state);
	});
});

describe("removeInteractionSelection", () => {
	const selectionsOf = (store: EnhancedStore) =>
		layersOf(store).pois?.options?.selections;

	it("keeps the interaction with an undefined value by default", () => {
		const {store} = createHighlightTestMap();
		expect(selectionsOf(store)).toEqual({mouseover: "highlight"});

		store.dispatch(removeInteractionSelection("map", "pois", "mouseover"));

		expect(selectionsOf(store)).toStrictEqual({mouseover: undefined});
		expect("mouseover" in (selectionsOf(store) ?? {})).toBe(true);
	});

	it("deletes the interaction with the future flag", () => {
		const {store} = createHighlightTestMap({
			future: {v15_unsetRemovesKey: true},
		});
		const poisBefore = layersOf(store).pois;

		store.dispatch(removeInteractionSelection("map", "pois", "mouseover"));

		expect(selectionsOf(store)).toStrictEqual({});
		expect(layersOf(store).pois).not.toBe(poisBefore);
		expect(layersOf(store).pois?.options?.source).toBe(
			poisBefore?.options?.source,
		);
	});

	it.each([
		["by default", undefined],
		["with the future flag", {v15_unsetRemovesKey: true}],
	])(
		"can be set again %s and ignores unknown interactions",
		(_name, future) => {
			const {store} = createHighlightTestMap({future});

			store.dispatch(
				removeInteractionSelection("map", "pois", "mouseover"),
			);
			store.dispatch(
				addInteractionSelection(
					"map",
					"pois",
					"mouseover",
					"highlight",
				),
			);
			expect(selectionsOf(store)).toStrictEqual({mouseover: "highlight"});

			const state = store.getState();
			store.dispatch(removeInteractionSelection("map", "pois", "touch"));
			store.dispatch(
				removeInteractionSelection("map", "gone", "mouseover"),
			);
			expect(store.getState()).toBe(state);
		},
	);
});
