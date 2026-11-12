import {describe, expect, it} from "vitest";

import {
	FEATURE_SOURCE_DATA,
	FEATURE_SOURCE_DATA_ADD_FEATURE,
	FEATURE_SOURCE_DATA_REMOVE_FEATURE,
	FEATURE_SOURCE_DATA_UNDO,
	LOAD_FEATURE_SOURCE_SUCCESS,
} from "@/lib/feature-sources/actions";
import {FeatureSourcesController} from "@/lib/feature-sources/controller";
import {
	hasFeatureSourceFeatureId,
	hasFeatureSourceLocalEdits,
	mapFeaturesToFeatureSource,
} from "@/lib/feature-sources/selectors";
import type {
	FeatureSourceState,
	FeatureSourcesState,
} from "@/lib/feature-sources/types";
import type {Action, Feature} from "@/types";

function feature(id: string): Feature {
	return {
		id,
		type: "Feature",
		geometry: {type: "Point", coordinates: [10, 10]},
		properties: {},
	};
}

const baseSource = {
	type: "local",
	data: null,
	lastUpdate: null,
	lastActionType: null,
} satisfies FeatureSourceState;

describe("hasFeatureSourceLocalEdits", () => {
	it("is false for untouched and loaded data", () => {
		expect(hasFeatureSourceLocalEdits(baseSource)).toBe(false);
		expect(
			hasFeatureSourceLocalEdits(
				mapFeaturesToFeatureSource([feature("a")]),
			),
		).toBe(false);
		expect(
			hasFeatureSourceLocalEdits({
				...baseSource,
				lastActionType: "DATA_LOADED",
			}),
		).toBe(false);
	});

	it("is false when the field is absent in unnormalized state", () => {
		expect(
			hasFeatureSourceLocalEdits({
				type: "local",
			} as unknown as FeatureSourceState),
		).toBe(false);
	});

	it("is true after an edit was recorded", () => {
		expect(
			hasFeatureSourceLocalEdits({
				...baseSource,
				lastActionType: "UPDATE_FEATURE",
			}),
		).toBe(true);
	});

	describe("with the feature sources controller", () => {
		const controller = new FeatureSourcesController("featureSources");
		const reduce = (state: FeatureSourcesState, action: Action) =>
			controller.reduce(state, action);
		const edits = (state: FeatureSourcesState) =>
			hasFeatureSourceLocalEdits(state.places!);

		const initial: FeatureSourcesState = {
			places: {
				type: "xhr-json",
				url: "/places.geojson",
				enableHistory: true,
				data: null,
				lastUpdate: null,
				lastActionType: null,
				isLoading: true,
			},
		};

		it("follows loading, editing, undo and reloading", () => {
			let state = reduce(initial, {type: "init"});
			expect(edits(state)).toBe(false);

			state = reduce(state, {
				type: LOAD_FEATURE_SOURCE_SUCCESS,
				id: "places",
				data: {type: "FeatureCollection", features: [feature("a")]},
			});
			expect(edits(state)).toBe(false);

			state = reduce(state, {
				type: FEATURE_SOURCE_DATA_ADD_FEATURE,
				id: "places",
				feature: feature("b"),
			});
			expect(edits(state)).toBe(true);

			state = reduce(state, {
				type: FEATURE_SOURCE_DATA_REMOVE_FEATURE,
				id: "places",
				featureId: "a",
			});
			expect(edits(state)).toBe(true);

			state = reduce(state, {
				type: FEATURE_SOURCE_DATA_UNDO,
				id: "places",
			});
			expect(edits(state)).toBe(true);

			state = reduce(state, {
				type: FEATURE_SOURCE_DATA_UNDO,
				id: "places",
			});
			expect(edits(state)).toBe(false);

			state = reduce(state, {
				type: FEATURE_SOURCE_DATA_ADD_FEATURE,
				id: "places",
				feature: feature("c"),
			});
			expect(edits(state)).toBe(true);

			// Pushing in a whole new data set replaces the edits.
			state = reduce(state, {
				type: FEATURE_SOURCE_DATA,
				id: "places",
				data: {type: "FeatureCollection", features: [feature("d")]},
			});
			expect(edits(state)).toBe(false);
		});
	});
});

describe("hasFeatureSourceFeatureId", () => {
	const source = {
		...baseSource,
		data: {
			type: "FeatureCollection",
			features: [feature("a"), feature("b")],
		},
		ids: ["a", "b"],
	} satisfies FeatureSourceState;

	it("finds ids of contained features", () => {
		expect(hasFeatureSourceFeatureId(source, "a")).toBe(true);
		expect(hasFeatureSourceFeatureId(source, "b")).toBe(true);
	});

	it("is false for other ids", () => {
		expect(hasFeatureSourceFeatureId(source, "c")).toBe(false);
		expect(hasFeatureSourceFeatureId(source, "")).toBe(false);
	});

	it("is false for sources without an id index", () => {
		expect(hasFeatureSourceFeatureId(baseSource, "a")).toBe(false);
		expect(hasFeatureSourceFeatureId({...baseSource, ids: []}, "a")).toBe(
			false,
		);
	});

	it("follows the ids of the state it is given", () => {
		const controller = new FeatureSourcesController("featureSources");
		const state = controller.reduce(
			{places: {...baseSource, data: source.data}},
			{type: "init"},
		);
		expect(hasFeatureSourceFeatureId(state.places!, "a")).toBe(true);

		const removed = controller.reduce(state, {
			type: FEATURE_SOURCE_DATA_REMOVE_FEATURE,
			id: "places",
			featureId: "a",
		});
		expect(hasFeatureSourceFeatureId(removed.places!, "a")).toBe(false);
		expect(hasFeatureSourceFeatureId(removed.places!, "b")).toBe(true);
	});
});
