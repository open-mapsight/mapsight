import type OlMap from "ol/Map";
import type VectorLayer from "ol/layer/Vector";

import {describe, expect, it, vi} from "vitest";

import {set} from "@/lib/base/actions";
import {select} from "@/lib/feature-selections/actions";
import {setData} from "@/lib/feature-sources/actions";
import {removeLayer} from "@/lib/map/actions";
import VectorFeatureSource from "@/lib/map/lib/VectorFeatureSource/VectorFeatureSource";
import {getIdForLayer} from "@/lib/map/lib/tagLayer";
import type {LayerState} from "@/lib/map/types";
import {createHighlightTestMap} from "@/test/create-highlight-test-map";

function collection(...ids: string[]) {
	return {
		type: "FeatureCollection" as const,
		features: ids.map((id, index) => ({
			id,
			type: "Feature" as const,
			properties: {},
			geometry: {
				type: "Point" as const,
				coordinates: [index * 10, 0] as [number, number],
			},
		})),
	};
}

/** A layer on the `pois` feature source whose source animates the map. */
const animatingLayer = (
	animation: Record<string, unknown> = {fitAllFeaturesInView: true},
): LayerState => ({
	type: "VectorLayer",
	options: {
		// not rendered: the DOM test environment has no canvas
		visible: false,
		source: {
			type: "VectorFeatureSource",
			options: {
				featureSourceId: "pois",
				featureSourcesControllerName: "featureSources",
				featureSelectionsControllerName: "featureSelections",
				canCluster: false,
				...animation,
			},
		},
		selections: {mouseover: "highlight"},
	},
});

function findOlLayer(map: OlMap, id: string): VectorLayer {
	for (const layer of map.getAllLayers()) {
		if (getIdForLayer(layer) === id) {
			return layer as VectorLayer;
		}
	}
	throw new Error(`Layer ${id} not found`);
}

function setup(animation?: Record<string, unknown>) {
	const context = createHighlightTestMap();
	context.store.dispatch(
		set(["map", "layers", "pois", "options", "visible"], false),
	);
	const fit = vi.spyOn(context.mapController, "fitMapViewToFeatures");
	context.store.dispatch(
		set(["map", "layers", "animated"], animatingLayer(animation)),
	);
	const source = findOlLayer(context.map, "animated").getSource();
	if (!(source instanceof VectorFeatureSource)) {
		throw new Error("Expected a VectorFeatureSource");
	}
	return {...context, fit, source};
}

describe("tearing down the source of a removed layer", () => {
	it("stops fitting the map to new data of the still existing feature source", () => {
		const {store, fit} = setup();

		store.dispatch(setData("featureSources", "pois", collection("a")));
		expect(fit).toHaveBeenCalledTimes(1);

		store.dispatch(removeLayer("map", "animated"));
		store.dispatch(setData("featureSources", "pois", collection("a", "b")));

		expect(fit).toHaveBeenCalledTimes(1);
	});

	it("stops fitting the map to selected features", () => {
		const {store, fit} = setup({
			fitFeaturesInViewSelections: ["highlight"],
		});
		store.dispatch(setData("featureSources", "pois", collection("a", "b")));
		fit.mockClear();

		store.dispatch(removeLayer("map", "animated"));
		store.dispatch(select("featureSelections", "highlight", "a"));

		expect(fit).not.toHaveBeenCalled();
	});

	it("does not sync features into the removed source any more", () => {
		const {store, source} = setup();
		store.dispatch(setData("featureSources", "pois", collection("a")));
		expect(source.getFeatures()).toHaveLength(1);
		const refresh = vi.spyOn(source, "refresh");

		store.dispatch(removeLayer("map", "animated"));
		store.dispatch(setData("featureSources", "pois", collection("a", "b")));
		store.dispatch(select("featureSelections", "highlight", "a"));

		expect(refresh).not.toHaveBeenCalled();
		expect(source.getFeatures()).toHaveLength(1);
	});

	it("does not react to map size changes any more", () => {
		const {store, fit} = setup({keepAllFeaturesInView: true});
		store.dispatch(setData("featureSources", "pois", collection("a")));
		fit.mockClear();
		store.dispatch(set(["map", "size"], [500, 500]));
		expect(fit).toHaveBeenCalledTimes(1);

		store.dispatch(removeLayer("map", "animated"));
		fit.mockClear();
		store.dispatch(set(["map", "size"], [600, 600]));

		expect(fit).not.toHaveBeenCalled();
	});

	it("keeps a second layer on the same feature source working", () => {
		const {store, map, fit} = setup();
		store.dispatch(set(["map", "layers", "second"], animatingLayer()));
		const second = findOlLayer(
			map,
			"second",
		).getSource() as VectorFeatureSource;

		store.dispatch(setData("featureSources", "pois", collection("a")));
		expect(fit).toHaveBeenCalledTimes(2);
		fit.mockClear();

		store.dispatch(removeLayer("map", "animated"));
		store.dispatch(setData("featureSources", "pois", collection("a", "b")));

		expect(fit).toHaveBeenCalledTimes(1);
		expect(second.getFeatures()).toHaveLength(2);
	});

	it("keeps the original layer working when only a sibling is removed", () => {
		const {store, source, fit} = setup();
		store.dispatch(set(["map", "layers", "second"], animatingLayer()));
		store.dispatch(removeLayer("map", "second"));

		store.dispatch(setData("featureSources", "pois", collection("a")));

		expect(fit).toHaveBeenCalledTimes(1);
		expect(source.getFeatures()).toHaveLength(1);
	});

	it("tears down the source of a layer that is replaced by a new layer object", () => {
		const {store, map, fit, source: oldSource} = setup();

		// `declutter` is a constructor-only option: changing it recreates the layer
		store.dispatch(
			set(["map", "layers", "animated", "options", "declutter"], true),
		);
		const newSource = findOlLayer(map, "animated").getSource();
		expect(newSource).not.toBe(oldSource);
		fit.mockClear();

		store.dispatch(setData("featureSources", "pois", collection("a")));

		expect(fit).toHaveBeenCalledTimes(1);
		expect((newSource as VectorFeatureSource).getFeatures()).toHaveLength(
			1,
		);
		expect(oldSource.getFeatures()).toHaveLength(0);
	});

	it("can be torn down more than once", () => {
		const {source} = setup();

		expect(() => {
			source.dispose();
			source.dispose();
		}).not.toThrow();
	});
});
