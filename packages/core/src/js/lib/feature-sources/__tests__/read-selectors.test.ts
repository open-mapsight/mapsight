import {describe, expect, it} from "vitest";

import {ACTION_MERGE} from "@/lib/base/reducer";
import {
	FEATURE_SOURCE_DATA,
	FEATURE_SOURCE_DATA_ADD_FEATURE,
	FEATURE_SOURCE_DATA_ADD_FEATURES,
	FEATURE_SOURCE_DATA_REDO,
	FEATURE_SOURCE_DATA_REMOVE_ALL_FEATURES,
	FEATURE_SOURCE_DATA_REMOVE_FEATURE,
	FEATURE_SOURCE_DATA_REMOVE_FEATURES,
	FEATURE_SOURCE_DATA_UNDO,
	FEATURE_SOURCE_DATA_UPDATE_FEATURE,
	FEATURE_SOURCE_DATA_UPDATE_FEATURES,
	FEATURE_SOURCE_DATA_UPDATE_FEATURE_GEOMETRY,
	FEATURE_SOURCE_DATA_UPDATE_FEATURE_PROPERTY,
	FEATURE_SOURCE_ERROR,
	LOAD_FEATURE_SOURCE,
	LOAD_FEATURE_SOURCE_ERROR,
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

		function loaded(state = initial) {
			return reduce(reduce(state, {type: "init"}), {
				type: LOAD_FEATURE_SOURCE_SUCCESS,
				id: "places",
				data: {
					type: "FeatureCollection",
					features: [feature("a"), feature("b")],
				},
			});
		}

		// One action per edit the controller supports.
		const editActions: Array<[string, Action]> = [
			[
				FEATURE_SOURCE_DATA_ADD_FEATURE,
				{
					type: FEATURE_SOURCE_DATA_ADD_FEATURE,
					id: "places",
					feature: feature("c"),
				},
			],
			[
				FEATURE_SOURCE_DATA_ADD_FEATURES,
				{
					type: FEATURE_SOURCE_DATA_ADD_FEATURES,
					id: "places",
					features: [feature("c")],
				},
			],
			[
				FEATURE_SOURCE_DATA_UPDATE_FEATURE,
				{
					type: FEATURE_SOURCE_DATA_UPDATE_FEATURE,
					id: "places",
					featureId: "a",
					feature: {...feature("a"), properties: {name: "x"}},
				},
			],
			[
				FEATURE_SOURCE_DATA_UPDATE_FEATURE_PROPERTY,
				{
					type: FEATURE_SOURCE_DATA_UPDATE_FEATURE_PROPERTY,
					id: "places",
					featureId: "a",
					propertyId: "name",
					value: "x",
				},
			],
			[
				FEATURE_SOURCE_DATA_UPDATE_FEATURES,
				{
					type: FEATURE_SOURCE_DATA_UPDATE_FEATURES,
					id: "places",
					features: [{...feature("a"), properties: {name: "x"}}],
				},
			],
			[
				FEATURE_SOURCE_DATA_UPDATE_FEATURE_GEOMETRY,
				{
					type: FEATURE_SOURCE_DATA_UPDATE_FEATURE_GEOMETRY,
					id: "places",
					featureId: "a",
					geometry: {type: "Point", coordinates: [1, 1]},
				},
			],
			[
				FEATURE_SOURCE_DATA_REMOVE_FEATURE,
				{
					type: FEATURE_SOURCE_DATA_REMOVE_FEATURE,
					id: "places",
					featureId: "a",
				},
			],
			[
				FEATURE_SOURCE_DATA_REMOVE_FEATURES,
				{
					type: FEATURE_SOURCE_DATA_REMOVE_FEATURES,
					id: "places",
					featureIds: ["a", "b"],
				},
			],
			[
				FEATURE_SOURCE_DATA_REMOVE_ALL_FEATURES,
				{type: FEATURE_SOURCE_DATA_REMOVE_ALL_FEATURES, id: "places"},
			],
		];

		it.each(editActions)(
			"%s counts as a local edit, undo and redo follow it",
			(_name, action) => {
				const base = loaded();
				expect(edits(base)).toBe(false);

				const edited = reduce(base, action);
				expect(edits(edited)).toBe(true);

				const undone = reduce(edited, {
					type: FEATURE_SOURCE_DATA_UNDO,
					id: "places",
				});
				expect(edits(undone)).toBe(false);

				const redone = reduce(undone, {
					type: FEATURE_SOURCE_DATA_REDO,
					id: "places",
				});
				expect(edits(redone)).toBe(true);
			},
		);

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

		it("stays true while a reload is pending and after it fails", () => {
			let state = reduce(loaded(), {
				type: FEATURE_SOURCE_DATA_ADD_FEATURE,
				id: "places",
				feature: feature("c"),
			});
			expect(edits(state)).toBe(true);

			state = reduce(state, {
				type: LOAD_FEATURE_SOURCE,
				id: "places",
				requestId: 1,
			});
			expect(state.places?.isLoading).toBe(true);
			expect(edits(state)).toBe(true);

			state = reduce(state, {
				type: LOAD_FEATURE_SOURCE_ERROR,
				id: "places",
				requestId: 1,
				error: {message: "offline"},
			});
			expect(state.places?.isLoading).toBe(false);
			expect(state.places?.error).toBeDefined();
			expect(state.places?.ids).toEqual(["a", "b", "c"]);
			expect(edits(state)).toBe(true);

			state = reduce(state, {
				type: FEATURE_SOURCE_ERROR,
				id: "places",
				error: {message: "broken"},
			});
			expect(edits(state)).toBe(true);
		});

		it("becomes false when a reload succeeds", () => {
			let state = reduce(loaded(), {
				type: FEATURE_SOURCE_DATA_ADD_FEATURE,
				id: "places",
				feature: feature("c"),
			});
			state = reduce(state, {
				type: LOAD_FEATURE_SOURCE,
				id: "places",
				requestId: 1,
			});
			state = reduce(state, {
				type: LOAD_FEATURE_SOURCE_SUCCESS,
				id: "places",
				requestId: 1,
				data: {type: "FeatureCollection", features: [feature("a")]},
			});

			expect(edits(state)).toBe(false);
		});

		it("is false again when a config change clears the data", () => {
			const edited = reduce(loaded(), {
				type: FEATURE_SOURCE_DATA_ADD_FEATURE,
				id: "places",
				feature: feature("c"),
			});
			expect(edits(edited)).toBe(true);

			const cleared = reduce(edited, {
				type: ACTION_MERGE,
				path: ["places"],
				value: {url: "/places-v2.geojson"},
			});

			expect(cleared.places?.data).toBeNull();
			expect(edits(cleared)).toBe(false);
		});

		it("undoes a whole-data write back to the edits before it", () => {
			let state = reduce(loaded(), {
				type: FEATURE_SOURCE_DATA_ADD_FEATURE,
				id: "places",
				feature: feature("c"),
			});
			state = reduce(state, {
				type: FEATURE_SOURCE_DATA,
				id: "places",
				data: {type: "FeatureCollection", features: [feature("d")]},
			});
			expect(edits(state)).toBe(false);

			// The state before setData had the unsaved edit again.
			state = reduce(state, {
				type: FEATURE_SOURCE_DATA_UNDO,
				id: "places",
			});
			expect(state.places?.ids).toEqual(["a", "b", "c"]);
			expect(edits(state)).toBe(true);

			state = reduce(state, {
				type: FEATURE_SOURCE_DATA_REDO,
				id: "places",
			});
			expect(state.places?.ids).toEqual(["d"]);
			expect(edits(state)).toBe(false);
		});

		it("undo right after setData restores untouched data as unedited", () => {
			let state = reduce(loaded(), {
				type: FEATURE_SOURCE_DATA,
				id: "places",
				data: {type: "FeatureCollection", features: [feature("d")]},
			});
			state = reduce(state, {
				type: FEATURE_SOURCE_DATA_UNDO,
				id: "places",
			});

			expect(state.places?.ids).toEqual(["a", "b"]);
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

	it("is false for sources without data or with an empty index", () => {
		expect(hasFeatureSourceFeatureId(baseSource, "a")).toBe(false);
		expect(hasFeatureSourceFeatureId({...baseSource, ids: []}, "a")).toBe(
			false,
		);
	});

	it("looks at the features when the id index is absent", () => {
		const unindexed = {...source, ids: undefined};

		expect(hasFeatureSourceFeatureId(unindexed, "a")).toBe(true);
		expect(hasFeatureSourceFeatureId(unindexed, "c")).toBe(false);
	});

	it("works on a source built with mapFeaturesToFeatureSource", () => {
		const built = mapFeaturesToFeatureSource([feature("a"), feature("b")]);

		expect(built.ids).toBeUndefined();
		expect(hasFeatureSourceFeatureId(built, "a")).toBe(true);
		expect(hasFeatureSourceFeatureId(built, "b")).toBe(true);
		expect(hasFeatureSourceFeatureId(built, "c")).toBe(false);
		expect(
			hasFeatureSourceFeatureId(mapFeaturesToFeatureSource([]), "a"),
		).toBe(false);
	});

	it("trusts the index over the features when both are present", () => {
		// A filtered source narrows `ids` and `data` together; the index wins.
		expect(hasFeatureSourceFeatureId({...source, ids: ["a"]}, "b")).toBe(
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
