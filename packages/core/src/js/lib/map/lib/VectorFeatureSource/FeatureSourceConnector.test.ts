import GeoJSON from "ol/format/GeoJSON";

import {describe, expect, it, vi} from "vitest";

import type {EnhancedStore, State} from "@/types";

import FeatureSourceConnector from "./FeatureSourceConnector";

const placeFeature = {
	id: "place-1",
	type: "Feature",
	geometry: {type: "Point", coordinates: [10.5, 52.2]},
	properties: {name: "Parkhaus Eiermarkt"},
};

function createStore(initial: State) {
	const state = initial;
	const listeners = new Set<() => void>();

	return {
		getState: () => state,
		subscribe(listener: () => void) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		dispatch() {},
	};
}

describe("FeatureSourceConnector", () => {
	it("does not refresh against an empty source while subscribe is wiring", () => {
		const format = new GeoJSON();
		const store = createStore({
			featureSources: {
				parking: {
					type: "xhr-json",
					url: "/parking.geojson",
					filters: [],
					data: {
						type: "FeatureCollection",
						features: [placeFeature],
					},
					lastUpdate: 1,
					lastActionType: "LOAD",
					isLoading: false,
				},
			},
			map: {},
		});
		const featureCounts: number[] = [];
		const connector = new FeatureSourceConnector({
			format,
			internalProjection: "EPSG:3857",
			onUpdate: () => {
				featureCounts.push(connector.getFeatures().length);
			},
		});

		connector.setId("parking");
		connector.setControllerName("featureSources");
		connector.setTargetControllerName("map");
		connector.setStore(store as unknown as EnhancedStore);

		expect(featureCounts).toEqual([1]);
		expect(connector.getFeatures()).toHaveLength(1);
	});

	it("refreshes once after a re-subscribe with the same store data", () => {
		const format = new GeoJSON();
		const store = createStore({
			featureSources: {
				parking: {
					type: "xhr-json",
					url: "/parking.geojson",
					filters: [],
					data: {
						type: "FeatureCollection",
						features: [placeFeature],
					},
					lastUpdate: 1,
					lastActionType: "LOAD",
					isLoading: false,
				},
			},
			map: {},
		});
		const onUpdate = vi.fn();
		const connector = new FeatureSourceConnector({
			format,
			internalProjection: "EPSG:3857",
			onUpdate: () => {
				onUpdate(connector.getFeatures().length);
			},
		});

		connector.setId("parking");
		connector.setControllerName("featureSources");
		connector.setTargetControllerName("map");
		connector.setStore(store as unknown as EnhancedStore);
		onUpdate.mockClear();

		connector.setInternalProjection("EPSG:3857");

		expect(onUpdate).toHaveBeenCalledTimes(1);
		expect(onUpdate).toHaveBeenCalledWith(1);
	});
});
