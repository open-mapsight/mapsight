import {describe, expect, it} from "vitest";

import {ACTION_MERGE} from "@/lib/base/reducer";
import {FEATURE_SOURCE_DATA_ADD_FEATURE} from "@/lib/feature-sources/actions";
import {FeatureSourcesController} from "@/lib/feature-sources/controller";
import type {FeatureSourcesState} from "@/lib/feature-sources/types";
import type {Feature} from "@/types";

const controller = new FeatureSourcesController("featureSources");

function mergeAt(path: string[], value: unknown) {
	return {
		type: ACTION_MERGE,
		path,
		value,
	};
}

function addFeatureAction(id: string, feature: Feature) {
	return {
		type: FEATURE_SOURCE_DATA_ADD_FEATURE,
		id,
		feature,
	};
}

const sensorFeature = {
	id: "sensor-1",
	type: "Feature",
	geometry: {
		type: "Point",
		coordinates: [10, 10],
	},
	properties: {},
} satisfies Feature;

const loadedState = {
	smartCity: {
		type: "xhr-json",
		url: "/smart-city.geojson",
		filters: [],
		data: {
			type: "FeatureCollection",
			features: [sensorFeature],
		},
		lastUpdate: 1,
		lastActionType: "DATA_LOADED",
	},
} satisfies FeatureSourcesState;

describe("FeatureSourcesController", () => {
	it("normalizes config-only sources to full runtime state", () => {
		const state = controller.reduce(
			{},
			mergeAt(["smartCity"], {
				type: "xhr-json",
				url: "/smart-city.geojson",
			}),
		);

		expect(state.smartCity).toMatchObject({
			type: "xhr-json",
			url: "/smart-city.geojson",
			data: null,
			lastUpdate: null,
			lastActionType: null,
		});
	});

	it("keeps cached xhr-json data when non-loader config changes", () => {
		const state = controller.reduce(
			loadedState,
			mergeAt(["smartCity"], {
				filters: ["tagFilter"],
			}),
		);

		expect(state.smartCity?.data).toStrictEqual(loadedState.smartCity.data);
		expect(state.smartCity?.lastUpdate).toBe(1);
		expect(state.smartCity?.filters).toEqual(["tagFilter"]);
	});

	it("clears cached xhr-json data when the loader url changes", () => {
		const state = controller.reduce(
			loadedState,
			mergeAt(["smartCity"], {
				url: "/smart-city-v2.geojson",
			}),
		);

		expect(state.smartCity?.data).toBeNull();
		expect(state.smartCity?.url).toBe("/smart-city-v2.geojson");
	});

	it("normalizes feature data and indexes features by id", () => {
		const state = controller.reduce(
			{},
			mergeAt(["smartCity"], {
				type: "local",
				data: {
					features: [sensorFeature],
				},
			}),
		);

		expect(state.smartCity?.data?.type).toBe("FeatureCollection");
		expect(state.smartCity?.ids).toEqual(["sensor-1"]);
		expect(state.smartCity?.featuresById).toEqual({
			"sensor-1": sensorFeature,
		});
	});

	it("limits data history when historyLimit is configured", () => {
		const state: FeatureSourcesState = {
			editor: {
				type: "local",
				enableHistory: true,
				historyLimit: 2,
				data: {
					type: "FeatureCollection",
					features: [],
				},
				lastUpdate: 1,
				lastActionType: null,
			},
		};

		let nextState = state;
		for (const feature of [
			{...sensorFeature, id: "sensor-1"},
			{...sensorFeature, id: "sensor-2"},
			{...sensorFeature, id: "sensor-3"},
		]) {
			nextState = controller.reduce(
				nextState,
				addFeatureAction("editor", feature),
			);
		}

		expect(nextState.editor?.dataHistory?.past).toHaveLength(2);
		expect(
			nextState.editor?.dataHistory?.past.map((snapshot) =>
				snapshot.data?.features?.map((feature) => feature.id),
			),
		).toEqual([["sensor-1"], ["sensor-1", "sensor-2"]]);
	});
});
