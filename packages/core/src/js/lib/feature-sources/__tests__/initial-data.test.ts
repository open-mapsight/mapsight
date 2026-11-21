import {afterEach, describe, expect, it, vi} from "vitest";

import {createMapsightStore} from "@/index";
import {load} from "@/lib/feature-sources/actions";
import {FeatureSourcesController} from "@/lib/feature-sources/controller";
import {
	findFeatureInFeatureSourcesById,
	getFeatureSourceError,
} from "@/lib/feature-sources/selectors";
import type {FeatureSourcesState} from "@/lib/feature-sources/types";

const controllerName = "featureSources";

const collection = {
	type: "FeatureCollection" as const,
	features: [
		{
			type: "Feature" as const,
			id: "a",
			geometry: {type: "Point" as const, coordinates: [1, 2]},
			properties: {name: "A"},
		},
	],
};

function createStore(source: Record<string, unknown>) {
	return createMapsightStore(
		{[controllerName]: new FeatureSourcesController(controllerName)},
		{},
		{[controllerName]: {plain: source}},
	);
}

function sources(store: ReturnType<typeof createStore>) {
	return (store.getState() as Record<string, FeatureSourcesState>)[
		controllerName
	] as FeatureSourcesState;
}

/** Waits until the load dispatched by the test has finished. */
async function settle(store: ReturnType<typeof createStore>) {
	await vi.waitFor(() => {
		const source = sources(store).plain!;
		expect(source.requestId).toBeDefined();
		expect(source.isLoading).toBe(false);
	});
}

describe("initial data in feature source config", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("indexes initial data of a noop source at store creation", () => {
		const store = createStore({type: "noop", data: collection});

		expect(sources(store).plain?.ids).toEqual(["a"]);
		expect(sources(store).plain?.featuresById?.a).toEqual(
			collection.features[0],
		);
		expect(findFeatureInFeatureSourcesById(sources(store), "a")).toEqual(
			collection.features[0],
		);
	});

	it("keeps initial data and stays error-free when a layer loads the source", async () => {
		const store = createStore({type: "noop", data: collection});

		store.dispatch(load(controllerName, "plain") as never);
		await settle(store);

		const source = sources(store).plain!;
		expect(getFeatureSourceError(source)).toBeFalsy();
		expect(source.error).toBeUndefined();
		expect(source.data?.features).toEqual(collection.features);
		expect(source.ids).toEqual(["a"]);
		expect(findFeatureInFeatureSourcesById(sources(store), "a")).toEqual(
			collection.features[0],
		);
	});

	it("treats an empty FeatureCollection as data and avoids the error state", async () => {
		const store = createStore({
			type: "noop",
			data: {type: "FeatureCollection", features: []},
		});

		store.dispatch(load(controllerName, "plain") as never);
		await settle(store);

		const source = sources(store).plain!;
		expect(source.error).toBeUndefined();
		expect(source.data?.features).toEqual([]);
	});

	it("ends in the error state `no data` for an empty noop source", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const store = createStore({type: "noop"});

		store.dispatch(load(controllerName, "plain") as never);
		await settle(store);

		expect(sources(store).plain?.error).toBe("no data");
	});
});
