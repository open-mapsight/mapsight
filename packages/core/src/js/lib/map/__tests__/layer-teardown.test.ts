import Feature from "ol/Feature";
import type OlMap from "ol/Map";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

import {describe, expect, it, vi} from "vitest";

import {set} from "@/lib/base/actions";
import {select} from "@/lib/feature-selections/actions";
import {removeFeatureSource, setData} from "@/lib/feature-sources/actions";
import {removeLayer} from "@/lib/map/actions";
import VectorFeatureSource from "@/lib/map/lib/VectorFeatureSource/VectorFeatureSource";
import {getIdForLayer} from "@/lib/map/lib/tagLayer";
import type {LayerState} from "@/lib/map/types";
import {di} from "@/ol-proxy";
import LazyMapboxVectorLayer from "@/ol-proxy/definitions/layer/LazyMapboxVectorLayer";
import MapboxVectorLayer from "@/ol-proxy/definitions/layer/MapboxVectorLayer";
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
		expect(source.getFeatures()).toHaveLength(0);
	});

	it("detaches the retired vector and overlay sources from a shared feature", () => {
		const setMap = vi.spyOn(VectorLayer.prototype, "setMap");
		try {
			const {store, map, mapController, source} = setup();
			const retiredLayer = findOlLayer(map, "animated");
			const overlay = setMap.mock.contexts.find(
				(layer): layer is VectorLayer =>
					layer instanceof VectorLayer &&
					getIdForLayer(layer) === "animated",
			);
			const overlaySource = overlay?.getSource();
			if (!(overlaySource instanceof VectorSource)) {
				throw new Error("Expected a vector selection overlay");
			}
			store.dispatch(setData("featureSources", "pois", collection("a")));
			const feature = source.getFeatureById("a");
			const sibling = findOlLayer(map, "pois").getSource();
			if (
				!(feature instanceof Feature) ||
				!(sibling instanceof VectorFeatureSource)
			) {
				throw new Error("Expected a shared vector feature");
			}
			expect(sibling.getFeatureById("a")).toBe(feature);
			const overlayOnly = new Feature(new Point([10, 0]));
			mapController.moveFeatureToOverlay(retiredLayer, feature);
			mapController.moveFeatureToOverlay(retiredLayer, overlayOnly);
			expect(overlaySource.getFeatures()).toEqual([feature, overlayOnly]);

			store.dispatch(removeLayer("map", "animated"));
			const sourceRevision = source.getRevision();
			const overlayRevision = overlaySource.getRevision();
			const siblingRevision = sibling.getRevision();
			feature.changed();
			overlayOnly.changed();

			expect(source.getRevision()).toBe(sourceRevision);
			expect(overlaySource.getRevision()).toBe(overlayRevision);
			expect(sibling.getRevision()).toBeGreaterThan(siblingRevision);
			expect(source.getFeatures()).toEqual([]);
			expect(overlaySource.getFeatures()).toEqual([]);
			expect(sibling.getFeatureById("a")).toBe(feature);
			expect(store.getState()).toHaveProperty("featureSources.pois.ids", [
				"a",
			]);
		} finally {
			setMap.mockRestore();
		}
	});

	it("starts a new layer empty when its deleted feature source ID is reused", () => {
		const {store, map, source} = setup();
		store.dispatch(setData("featureSources", "pois", collection("old")));
		expect(source.getFeatures().map((feature) => feature.getId())).toEqual([
			"old",
		]);

		store.dispatch(removeLayer("map", "animated"));
		store.dispatch(removeLayer("map", "pois"));
		store.dispatch(removeFeatureSource("featureSources", "pois"));
		store.dispatch(
			set(["featureSources", "pois"], {type: "local", data: null}),
		);
		store.dispatch(set(["map", "layers", "animated"], animatingLayer()));

		const replacement = findOlLayer(map, "animated").getSource();
		if (!(replacement instanceof VectorFeatureSource)) {
			throw new Error("Expected a replacement VectorFeatureSource");
		}
		expect(replacement.getFeatures()).toEqual([]);

		store.dispatch(setData("featureSources", "pois", collection("new")));
		expect(
			replacement.getFeatures().map((feature) => feature.getId()),
		).toEqual(["new"]);
	});

	it("keeps the surviving layer's display without passing it to a new layer", () => {
		const {store, map, source: sibling} = setup();
		store.dispatch(set(["map", "layers", "recreated"], animatingLayer()));
		store.dispatch(setData("featureSources", "pois", collection("old")));
		expect(sibling.getFeatureById("old")).toBeTruthy();

		store.dispatch(removeLayer("map", "recreated"));
		store.dispatch(removeFeatureSource("featureSources", "pois"));
		expect(sibling.getFeatureById("old")).toBeTruthy();
		store.dispatch(
			set(["featureSources", "pois"], {type: "local", data: null}),
		);
		store.dispatch(set(["map", "layers", "recreated"], animatingLayer()));

		const replacement = findOlLayer(map, "recreated").getSource();
		if (!(replacement instanceof VectorFeatureSource)) {
			throw new Error("Expected a replacement VectorFeatureSource");
		}
		expect(replacement.getFeatures()).toEqual([]);
		expect(sibling.getFeatureById("old")).toBeTruthy();

		store.dispatch(setData("featureSources", "pois", collection("new")));
		for (const source of [sibling, replacement]) {
			expect(
				source.getFeatures().map((feature) => feature.getId()),
			).toEqual(["new"]);
		}
	});

	it.each([true, false])(
		"applies a queued edit only to its original source (source removed: %s)",
		(removeSource) => {
			vi.useFakeTimers();
			try {
				const {store, source} = setup();
				const feature = new Feature(new Point([0, 0]));
				feature.setId("edit");
				source.addFeature(feature);

				store.dispatch(removeLayer("map", "animated"));
				if (removeSource) {
					store.dispatch(
						removeFeatureSource("featureSources", "pois"),
					);
					store.dispatch(
						set(["featureSources", "pois"], {
							type: "local",
							data: null,
						}),
					);
				} else {
					store.dispatch(
						setData("featureSources", "pois", collection("new")),
					);
				}

				vi.runAllTimers();
				expect(store.getState()).toHaveProperty(
					"featureSources.pois.ids",
					removeSource ? undefined : ["new", "edit"],
				);
			} finally {
				vi.useRealTimers();
			}
		},
	);

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

describe("disposing controller-owned layers", () => {
	it.each(["removal", "replacement"])(
		"disposes a Mapbox vector layer on %s",
		(operation) => {
			di.injectDefinitions([MapboxVectorLayer]);
			const {store, map} = createHighlightTestMap();
			store.dispatch(
				set(["map", "layers", "tiles"], {
					type: "MapboxVectorLayer",
					options: {visible: false, styleUrl: "/original.json"},
				}),
			);
			const layer = map
				.getAllLayers()
				.find((layer) => getIdForLayer(layer) === "tiles");
			if (!(layer instanceof LazyMapboxVectorLayer)) {
				throw new Error("Expected a Mapbox vector layer");
			}
			expect(layer.getSource()).not.toBeNull();

			if (operation === "removal") {
				store.dispatch(removeLayer("map", "tiles"));
			} else {
				store.dispatch(
					set(
						["map", "layers", "tiles", "options", "styleUrl"],
						"/replacement.json",
					),
				);
			}

			expect(map.getAllLayers()).not.toContain(layer);
			expect(layer.getSource()).toBeNull();
		},
	);
});
