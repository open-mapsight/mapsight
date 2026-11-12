import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {createMapsightStore} from "@/index";
import {set, unset} from "@/lib/base/actions";
import {ACTION_REMOVE_KEY} from "@/lib/base/reducer";
import {
	addFeature,
	addFeatures,
	load,
	loadFailure,
	loadSuccess,
	pauseRefreshUntilNextLoad,
	redo,
	removeAllFeatures,
	removeFeature,
	removeFeatureSource,
	removeFeatures,
	setData,
	setError,
	undo,
	updateFeature,
	updateFeatureGeometry,
	updateFeatureProperty,
	updateFeatures,
} from "@/lib/feature-sources/actions";
import {estimateFeatureSourcesStateBytes} from "@/lib/feature-sources/cache/estimate-bytes";
import {FeatureSourcesController} from "@/lib/feature-sources/controller";
import {getCombinedFeatureSourceBindings} from "@/lib/feature-sources/lib/combined";
import {
	findFeatureInFeatureSourcesById,
	findFeatureSourceIdForFeatureId,
} from "@/lib/feature-sources/selectors";
import type {
	FeatureSourceData,
	FeatureSourcesState,
} from "@/lib/feature-sources/types";
import type {Feature} from "@/types";

const controllerName = "featureSources";

function feature(id: string): Feature {
	return {
		id,
		type: "Feature",
		properties: {name: id},
		geometry: {type: "Point", coordinates: [10, 52]},
	};
}
const collection = (...ids: string[]): FeatureSourceData => ({
	type: "FeatureCollection",
	features: ids.map(feature),
});

function createStore() {
	return createMapsightStore(
		{[controllerName]: new FeatureSourcesController(controllerName)},
		{},
		{
			[controllerName]: {
				items: {type: "local", data: collection("a1")},
				other: {type: "local", data: collection("b1")},
				combined: {
					type: "combined",
					featureSourceNames: ["items", "other"],
				},
			},
		},
	);
}
type TestStore = ReturnType<typeof createStore>;

function sources(store: TestStore) {
	return store.getState()[controllerName] as FeatureSourcesState;
}
function combinedIds(store: TestStore) {
	return sources(store).combined?.data?.features?.map((f) => f.id);
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("removeFeatureSource", () => {
	it("creates a removeKey action for the source", () => {
		expect(removeFeatureSource(controllerName, "items")).toEqual({
			type: ACTION_REMOVE_KEY,
			meta: {path: [controllerName, "items"]},
		});
	});

	it("deletes the key and keeps the other sources by reference", async () => {
		const store = createStore();
		await vi.runAllTimersAsync();
		const before = sources(store);

		store.dispatch(removeFeatureSource(controllerName, "other"));

		expect(Object.keys(sources(store))).toEqual(["items", "combined"]);
		expect(sources(store).items).toBe(before.items);
	});

	it("leaves the state reference unchanged for unknown source ids", async () => {
		const store = createStore();
		await vi.runAllTimersAsync();
		const before = store.getState();

		store.dispatch(removeFeatureSource(controllerName, "unknown"));

		expect(store.getState()).toBe(before);
	});

	it("ignores later actions for the removed source instead of throwing or recreating it", async () => {
		const store = createStore();
		await vi.runAllTimersAsync();
		store.dispatch(removeFeatureSource(controllerName, "items"));

		expect(() => {
			store.dispatch(setData(controllerName, "items", collection("x")));
			store.dispatch(setError(controllerName, "items", "failure"));
			store.dispatch(
				loadSuccess(controllerName, "items", collection("x")),
			);
			store.dispatch(loadFailure(controllerName, "items", "failure"));
			store.dispatch(pauseRefreshUntilNextLoad(controllerName, "items"));
			store.dispatch(addFeature(controllerName, "items", feature("x")));
			store.dispatch(
				addFeatures(controllerName, "items", [feature("x")]),
			);
			store.dispatch(
				updateFeature(controllerName, "items", "a1", feature("a1")),
			);
			store.dispatch(
				updateFeatureProperty(
					controllerName,
					"items",
					"a1",
					"k",
					1,
					undefined,
				),
			);
			store.dispatch(
				updateFeatures(controllerName, "items", [feature("a1")]),
			);
			store.dispatch(
				updateFeatureGeometry(controllerName, "items", "a1", {
					type: "Point",
					coordinates: [1, 1],
				}),
			);
			store.dispatch(removeFeature(controllerName, "items", "a1"));
			store.dispatch(removeFeatures(controllerName, "items", ["a1"]));
			store.dispatch(removeAllFeatures(controllerName, "items"));
			store.dispatch(undo(controllerName, "items"));
			store.dispatch(redo(controllerName, "items"));
			store.dispatch(load(controllerName, "items"));
		}).not.toThrow();
		await vi.runAllTimersAsync();

		expect("items" in sources(store)).toBe(false);
	});

	it("keeps a combined source working without the removed member", async () => {
		const store = createStore();
		await vi.runAllTimersAsync();
		expect(combinedIds(store)).toEqual(["a1", "b1"]);

		expect(() =>
			store.dispatch(removeFeatureSource(controllerName, "items")),
		).not.toThrow();
		await vi.runAllTimersAsync();

		expect(combinedIds(store)).toEqual(["b1"]);
		store.dispatch(setData(controllerName, "other", collection("b2")));
		await vi.runAllTimersAsync();
		expect(combinedIds(store)).toEqual(["b2"]);
	});

	it("unbinds a removed combined source and does not recreate it", async () => {
		const store = createStore();
		await vi.runAllTimersAsync();

		store.dispatch(removeFeatureSource(controllerName, "combined"));
		store.dispatch(setData(controllerName, "items", collection("a2")));
		await vi.runAllTimersAsync();

		expect("combined" in sources(store)).toBe(false);
	});

	it("does not fail when a combined update is queued while the combined source is removed", async () => {
		const store = createStore();
		await vi.runAllTimersAsync();

		expect(() => {
			// The member change queues an update for the combined source ...
			store.dispatch(setData(controllerName, "items", collection("a2")));
			// ... which is reduced after the combined source is gone.
			store.dispatch(removeFeatureSource(controllerName, "combined"));
		}).not.toThrow();
		await vi.runAllTimersAsync();

		expect("combined" in sources(store)).toBe(false);
	});
});

describe("unset of a feature source", () => {
	it("keeps the key with an undefined value and later actions do not throw", async () => {
		const store = createStore();
		await vi.runAllTimersAsync();

		expect(() =>
			store.dispatch(unset([controllerName, "items"])),
		).not.toThrow();
		expect(sources(store).items).toBeUndefined();
		expect("items" in sources(store)).toBe(true);

		expect(() => {
			store.dispatch(set([controllerName, "extra"], {type: "local"}));
			store.dispatch(setData(controllerName, "other", collection("b2")));
			store.dispatch(load(controllerName, "items"));
			store.dispatch(unset([controllerName, "combined"]));
		}).not.toThrow();
		await vi.runAllTimersAsync();
		expect(sources(store).extra).toBeDefined();
	});
});

describe("feature source selectors with undefined entries", () => {
	it("skips them when searching for a feature", async () => {
		const store = createStore();
		await vi.runAllTimersAsync();
		store.dispatch(unset([controllerName, "other"]));
		await vi.runAllTimersAsync();
		const state = sources(store);

		expect(findFeatureSourceIdForFeatureId(state, "a1")).toBe("items");
		expect(findFeatureSourceIdForFeatureId(state, "b1")).toBeNull();
		expect(findFeatureInFeatureSourcesById(state, "b1")).toBeNull();
	});

	it("skips them when collecting combined bindings", () => {
		expect(
			getCombinedFeatureSourceBindings({
				gone: undefined,
				combined: {type: "combined", featureSourceNames: ["a"]},
				plain: {type: "local"},
			} as unknown as FeatureSourcesState),
		).toEqual({combined: ["a"]});
	});

	it("skips them when estimating the cache size", () => {
		expect(
			estimateFeatureSourcesStateBytes({
				gone: undefined,
				items: {type: "local", data: collection("a1")},
			} as unknown as FeatureSourcesState),
		).toBeGreaterThan(0);
	});
});
