import GeoJSON from "ol/format/GeoJSON";

import {describe, expect, it, vi} from "vitest";

import type {EnhancedStore, State} from "@/types";

import SharedReadonlyVectorFeatureSource from "./SharedReadonlyVectorFeatureSource";

const placeFeature = {
	id: "place-1",
	type: "Feature",
	geometry: {type: "Point", coordinates: [10.5, 52.2]},
	properties: {name: "Parkhaus Eiermarkt", markerCaption: "207"},
};

function createStore(initial: State) {
	let state = initial;
	const listeners = new Set<() => void>();

	return {
		getState: () => state,
		subscribe(listener: () => void) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		setState(next: State) {
			state = next;
			for (const listener of listeners) {
				listener();
			}
		},
	};
}

function sourceState(features: (typeof placeFeature)[]): State {
	return {
		featureSources: {
			parking: {
				type: "xhr-json",
				url: "/parking.geojson",
				filters: [],
				data: {
					type: "FeatureCollection",
					features,
				},
				lastUpdate: 1,
				lastActionType: "LOAD",
				isLoading: false,
			},
		},
		map: {},
	};
}

describe("SharedReadonlyVectorFeatureSource", () => {
	it("notifies the subscriber when the store already has feature data", () => {
		const format = new GeoJSON();
		const store = createStore(sourceState([placeFeature]));
		const onUpdate = vi.fn();

		SharedReadonlyVectorFeatureSource.subscribe(
			store as unknown as EnhancedStore,
			"featureSources",
			"parking",
			"map",
			format,
			undefined,
			undefined,
			onUpdate,
		);

		expect(onUpdate).toHaveBeenCalled();
	});

	it("notifies a late subscriber of already-loaded features", () => {
		const format = new GeoJSON();
		const store = createStore(sourceState([placeFeature]));
		const first = vi.fn();
		const late = vi.fn();

		SharedReadonlyVectorFeatureSource.subscribe(
			store as unknown as EnhancedStore,
			"featureSources",
			"parking",
			"map",
			format,
			undefined,
			undefined,
			first,
		);
		SharedReadonlyVectorFeatureSource.subscribe(
			store as unknown as EnhancedStore,
			"featureSources",
			"parking",
			"map",
			format,
			undefined,
			undefined,
			late,
		);

		expect(late).toHaveBeenCalled();
	});

	it("notifies again after unsubscribe when store data is unchanged", () => {
		const format = new GeoJSON();
		const store = createStore(sourceState([placeFeature]));
		const first = vi.fn();
		const again = vi.fn();

		const {unsubscribe} = SharedReadonlyVectorFeatureSource.subscribe(
			store as unknown as EnhancedStore,
			"featureSources",
			"parking",
			"map",
			format,
			undefined,
			undefined,
			first,
		);
		unsubscribe();

		SharedReadonlyVectorFeatureSource.subscribe(
			store as unknown as EnhancedStore,
			"featureSources",
			"parking",
			"map",
			format,
			undefined,
			undefined,
			again,
		);

		expect(again).toHaveBeenCalled();
	});
});
