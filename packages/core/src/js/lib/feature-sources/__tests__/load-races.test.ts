import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {createMapsightStore} from "@/index";
import {merge, set} from "@/lib/base/actions";
import {ACTION_MERGE, ACTION_SET} from "@/lib/base/reducer";
import {
	addFeature,
	load,
	loadFailure,
	loadSuccess,
	setData,
	undo,
} from "@/lib/feature-sources/actions";
import {FeatureSourcesController} from "@/lib/feature-sources/controller";
import type {
	FeatureSourceData,
	FeatureSourcesState,
} from "@/lib/feature-sources/types";

const controllerName = "featureSources";
const sourceId = "places";
const collection = (id: string): FeatureSourceData => ({
	type: "FeatureCollection",
	features: [
		{
			id,
			type: "Feature",
			properties: {name: id},
			geometry: {type: "Point", coordinates: [10, 52]},
		},
	],
});
const source = () => ({
	type: "xhr-json" as const,
	url: "/old.geojson",
	data: null,
	lastUpdate: null,
	lastActionType: null,
});

function createStore(overrides: Partial<FeatureSourcesState[string]> = {}) {
	return createMapsightStore(
		{[controllerName]: new FeatureSourcesController(controllerName)},
		{},
		{[controllerName]: {[sourceId]: {...source(), ...overrides}}},
	);
}
function current(store: ReturnType<typeof createStore>) {
	return (store.getState()[controllerName] as FeatureSourcesState)[sourceId];
}
function deferredFetch() {
	const pending: {
		resolve(data: FeatureSourceData): void;
		reject(error: Error): void;
		url: string;
	}[] = [];
	const fetch = vi.fn(
		(url: string) =>
			new Promise((resolve, reject) => {
				pending.push({
					url,
					reject,
					resolve: (data) =>
						resolve({
							ok: true,
							status: 200,
							headers: {get: () => null},
							json: () => Promise.resolve(data),
						}),
				});
			}),
	);
	vi.stubGlobal("fetch", fetch);
	return {pending, fetch};
}
async function tick(ms = 10) {
	await vi.advanceTimersByTimeAsync(ms);
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
	vi.clearAllTimers();
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("feature-source definition invalidation", () => {
	it.each([
		{type: ACTION_MERGE, path: [sourceId], value: {url: "/new.geojson"}},
		{type: ACTION_SET, path: [sourceId, "url"], value: "/new.geojson"},
		{type: ACTION_MERGE, path: [sourceId], value: {type: "local"}},
		{type: ACTION_SET, path: [sourceId, "type"], value: "local"},
	])(
		"clears old payload, lookup, error, load and history metadata together: $type $path",
		(action) => {
			const controller = new FeatureSourcesController(controllerName);
			const original = controller.reduce(
				{
					[sourceId]: {
						...source(),
						data: collection("old"),
						doRefresh: true,
						timer: 1000,
						isLoading: true,
						requestId: 7,
						error: "old failure",
						refreshPaused: true,
						lastUpdate: 1,
						lastActionType: "DATA_LOADED",
						enableHistory: true,
						dataHistory: {
							past: [
								{
									data: collection("history"),
									lastUpdate: 1,
									lastActionType: "DATA_LOADED",
								},
							],
							future: [],
						},
					},
				},
				{type: "initialize"},
			);
			const next = controller.reduce(original, action)[sourceId]!;
			expect(next.data).toBeNull();
			for (const key of [
				"ids",
				"featuresById",
				"featuresKey",
				"featuresCount",
				"error",
				"refreshPaused",
				"dataHistory",
			] as const)
				expect(next[key]).toBeUndefined();
			expect(next.isLoading).toBe(false);
			expect(next.requestId).toBe(7);
			expect(next.lastUpdate).toBeNull();
			expect(next.lastActionType).toBeNull();
			expect(next.doRefresh).toBe(true);
			expect(next.timer).toBe(1000);
			expect(original[sourceId]?.ids).toEqual(["old"]);
		},
	);

	it("keeps edited local data and history for unrelated config updates", () => {
		const controller = new FeatureSourcesController(controllerName);
		const original = controller.reduce(
			{
				[sourceId]: {
					...source(),
					type: "local",
					data: collection("edited"),
					enableHistory: true,
				},
			},
			{type: "initialize"},
		);
		const edited = controller.reduce(
			original,
			addFeature(
				controllerName,
				sourceId,
				collection("new").features![0]!,
			),
		);
		const next = controller.reduce(edited, {
			type: ACTION_MERGE,
			path: [sourceId],
			value: {filters: ["tagFilter"]},
		});
		expect(next[sourceId]?.data).toEqual(edited[sourceId]?.data);
		expect(next[sourceId]?.dataHistory).toEqual(
			edited[sourceId]?.dataHistory,
		);
		expect(next[sourceId]?.lastActionType).toBe(
			edited[sourceId]?.lastActionType,
		);
	});
});

describe("feature-source load ownership", () => {
	it.each(["success", "failure"] as const)(
		"ignores an old %s before the new request completes",
		async (result) => {
			const {pending} = deferredFetch();
			const store = createStore();
			store.dispatch(load(controllerName, sourceId));
			await tick();
			store.dispatch(
				merge([controllerName, sourceId], {url: "/new.geojson"}),
			);
			expect(current(store)?.isLoading).toBe(false);
			store.dispatch(load(controllerName, sourceId));
			await tick();
			const requestId = current(store)?.requestId;
			if (result === "success") pending[0]!.resolve(collection("old"));
			else pending[0]!.reject(new Error("old failure"));
			await tick();
			expect(current(store)).toMatchObject({
				data: null,
				isLoading: true,
				requestId,
			});
			expect(current(store)?.error).toBeUndefined();
			pending[1]!.resolve(collection("new"));
			await tick();
			expect(current(store)?.ids).toEqual(["new"]);
			expect(current(store)?.isLoading).toBe(false);
		},
	);

	it.each(["success", "failure"] as const)(
		"ignores an old %s after the new request completes",
		async (result) => {
			const {pending} = deferredFetch();
			const store = createStore();
			store.dispatch(load(controllerName, sourceId));
			await tick();
			store.dispatch(
				set([controllerName, sourceId, "url"], "/new.geojson"),
			);
			store.dispatch(load(controllerName, sourceId));
			await tick();
			pending[1]!.resolve(collection("new"));
			await tick();
			const latest = current(store);
			if (result === "success") pending[0]!.resolve(collection("old"));
			else pending[0]!.reject(new Error("old failure"));
			await tick();
			expect(current(store)).toBe(latest);
		},
	);

	it("checks queued completions at reduction time", async () => {
		const {pending} = deferredFetch();
		const store = createStore();
		store.dispatch(load(controllerName, sourceId));
		await tick();
		pending[0]!.resolve(collection("old"));
		await tick(0); // The resolved completion is queued, but has not reduced.
		store.dispatch(
			merge([controllerName, sourceId], {url: "/new.geojson"}),
		);
		await tick();
		expect(current(store)?.data).toBeNull();
		expect(current(store)?.ids).toBeUndefined();
	});

	it.each(["success", "failure"] as const)(
		"ignores a removed source's late %s and never recreates it",
		async (result) => {
			const {pending} = deferredFetch();
			const store = createStore();
			store.dispatch(load(controllerName, sourceId));
			await tick();
			store.dispatch(set([controllerName], {}));
			if (result === "success") pending[0]!.resolve(collection("old"));
			else pending[0]!.reject(new Error("old failure"));
			await tick();
			expect(current(store)).toBeUndefined();
			store.dispatch(load(controllerName, sourceId));
			await tick();
			expect(current(store)).toBeUndefined();
		},
	);

	it("does not reuse a token after remove/re-add with the same id and URL", async () => {
		const {pending} = deferredFetch();
		const store = createStore({requestId: Number.MAX_SAFE_INTEGER});
		store.dispatch(load(controllerName, sourceId));
		await tick();
		const firstToken = current(store)?.requestId;
		store.dispatch(set([controllerName], {}));
		store.dispatch(set([controllerName, sourceId], source()));
		store.dispatch(load(controllerName, sourceId));
		await tick();
		expect(current(store)?.requestId).not.toBe(firstToken);
		pending[0]!.resolve(collection("old"));
		await tick();
		expect(current(store)?.data).toBeNull();
		pending[1]!.resolve(collection("new"));
		await tick();
		expect(current(store)?.ids).toEqual(["new"]);
	});

	it("deduplicates pending loads and lets a forced refresh supersede one", async () => {
		const {pending, fetch} = deferredFetch();
		const store = createStore();
		store.dispatch(load(controllerName, sourceId));
		await tick();
		store.dispatch(load(controllerName, sourceId));
		await tick();
		expect(fetch).toHaveBeenCalledOnce();
		store.dispatch(load(controllerName, sourceId, {forceRefresh: true}));
		await tick();
		expect(fetch).toHaveBeenCalledTimes(2);
		pending[1]!.resolve(collection("fresh"));
		await tick();
		pending[0]!.resolve(collection("old"));
		await tick();
		expect(current(store)?.ids).toEqual(["fresh"]);
	});

	it("protects a local edit made while a network load is pending", async () => {
		const {pending} = deferredFetch();
		const store = createStore();
		store.dispatch(load(controllerName, sourceId));
		await tick();
		store.dispatch(setData(controllerName, sourceId, collection("edited")));
		pending[0]!.resolve(collection("network"));
		await tick();
		expect(current(store)?.ids).toEqual(["edited"]);
	});

	it.each(["set", "merge"] as const)(
		"protects data installed by a generic %s while loading",
		async (method) => {
			const {pending} = deferredFetch();
			const store = createStore();
			store.dispatch(load(controllerName, sourceId));
			await tick();
			store.dispatch(
				method === "set"
					? set(
							[controllerName, sourceId, "data"],
							collection("installed"),
						)
					: merge([controllerName, sourceId], {
							data: collection("installed"),
						}),
			);
			expect(current(store)?.isLoading).toBe(false);
			pending[0]!.resolve(collection("network"));
			await tick();
			expect(current(store)?.ids).toEqual(["installed"]);
		},
	);

	it("keeps the active request through a deep-equal legacy config copy", async () => {
		const {pending} = deferredFetch();
		const store = createStore({data: collection("before")});
		store.dispatch(load(controllerName, sourceId, {forceRefresh: true}));
		await tick();
		const requestId = current(store)?.requestId;
		store.dispatch(
			merge([controllerName, sourceId], {filters: ["tagFilter"]}),
		);
		expect(current(store)).toMatchObject({requestId, isLoading: true});
		pending[0]!.resolve(collection("network"));
		await tick();
		expect(current(store)?.ids).toEqual(["network"]);
	});

	it("ignores a pending response after changing the source type", async () => {
		const {pending} = deferredFetch();
		const store = createStore();
		store.dispatch(load(controllerName, sourceId));
		await tick();
		store.dispatch(merge([controllerName, sourceId], {type: "local"}));
		store.dispatch(setData(controllerName, sourceId, collection("local")));
		pending[0]!.resolve(collection("network"));
		await tick();
		expect(current(store)?.type).toBe("local");
		expect(current(store)?.ids).toEqual(["local"]);
	});

	it("keeps edits and undo history made after a refresh starts", async () => {
		const {pending} = deferredFetch();
		const store = createStore({
			data: collection("before"),
			enableHistory: true,
		});
		store.dispatch(load(controllerName, sourceId, {forceRefresh: true}));
		await tick();
		store.dispatch(
			addFeature(
				controllerName,
				sourceId,
				collection("edited").features![0]!,
			),
		);
		const edited = current(store);
		expect(edited?.ids).toEqual(["before", "edited"]);
		expect(edited?.dataHistory?.past).toHaveLength(1);
		pending[0]!.resolve(collection("network"));
		await tick();
		expect(current(store)).toBe(edited);
		store.dispatch(undo(controllerName, sourceId));
		expect(current(store)?.ids).toEqual(["before"]);
	});

	it("does not replace the current failure with an older successful response", async () => {
		const {pending} = deferredFetch();
		const store = createStore();
		store.dispatch(load(controllerName, sourceId));
		await tick();
		store.dispatch(load(controllerName, sourceId, {forceRefresh: true}));
		await tick();
		const failure = new Error("current failure");
		pending[1]!.reject(failure);
		await tick();
		expect(current(store)?.error).toBe(failure);
		const failed = current(store);
		pending[0]!.resolve(collection("old"));
		await tick();
		expect(current(store)).toBe(failed);
	});

	it("retains the manual completion action contract without a token", async () => {
		const store = createStore();
		store.dispatch(
			loadSuccess(controllerName, sourceId, collection("manual")),
		);
		await tick();
		expect(current(store)?.ids).toEqual(["manual"]);
		store.dispatch(loadFailure(controllerName, sourceId, "manual failure"));
		await tick();
		expect(current(store)?.error).toBe("manual failure");
	});

	it("keeps polling after generic data replaces a pending result", async () => {
		const {pending, fetch} = deferredFetch();
		const store = createStore({doRefresh: true, timer: 100});
		store.dispatch(load(controllerName, sourceId));
		await tick();
		const requestId = current(store)?.requestId;
		store.dispatch(
			set([controllerName, sourceId, "data"], collection("installed")),
		);
		expect(current(store)).toMatchObject({isLoading: false, requestId});
		pending[0]!.resolve(collection("retired"));
		await tick();
		expect(current(store)?.ids).toEqual(["installed"]);
		await tick(100);
		expect(fetch).toHaveBeenCalledTimes(2);
		expect(pending[1]?.url).toContain("/old.geojson");
		pending[1]!.resolve(collection("polled"));
		await tick();
		expect(current(store)?.ids).toEqual(["polled"]);
	});

	it.each(["loaded", "pending success", "pending failure"] as const)(
		"keeps polling and retrying the new URL without an explicit reload after a %s request",
		async (previous) => {
			const {pending, fetch} = deferredFetch();
			const store = createStore({doRefresh: true, timer: 100});
			store.dispatch(load(controllerName, sourceId));
			await tick();
			if (previous === "loaded") {
				pending[0]!.resolve(collection("old"));
				await tick();
			}

			store.dispatch(
				merge([controllerName, sourceId], {url: "/new.geojson"}),
			);
			if (previous === "pending success")
				pending[0]!.resolve(collection("retired"));
			else if (previous === "pending failure")
				pending[0]!.reject(new Error("retired failure"));
			await tick();
			expect(current(store)?.data).toBeNull();
			expect(current(store)?.error).toBeUndefined();
			expect(current(store)?.isLoading).toBe(false);

			await tick(100);
			expect(fetch).toHaveBeenCalledTimes(2);
			expect(pending[1]?.url).toContain("/new.geojson");
			const failure = new Error("new URL temporarily unavailable");
			pending[1]!.reject(failure);
			await tick();
			expect(current(store)?.error).toBe(failure);

			await tick(100);
			expect(fetch).toHaveBeenCalledTimes(3);
			expect(pending[2]?.url).toContain("/new.geojson");
			pending[2]!.resolve(collection("polled"));
			await tick();
			expect(current(store)?.ids).toEqual(["polled"]);
			expect(current(store)?.error).toBeUndefined();
		},
	);

	it("retires the old refresh timer while the current definition keeps polling", async () => {
		const {pending, fetch} = deferredFetch();
		const store = createStore({doRefresh: true, timer: 100});
		store.dispatch(load(controllerName, sourceId));
		await tick(); // t=10, old timer due at 110
		pending[0]!.resolve(collection("old"));
		await tick();
		await tick(20); // t=40
		store.dispatch(
			merge([controllerName, sourceId], {url: "/new.geojson"}),
		);
		store.dispatch(load(controllerName, sourceId));
		await tick(); // t=50, new timer due at 150
		pending[1]!.resolve(collection("new"));
		await tick();
		await tick(50); // t=110
		expect(fetch).toHaveBeenCalledTimes(2);
		await tick(50); // current timer queues the next load at 150, executes at 160
		expect(fetch).toHaveBeenCalledTimes(3);
		expect(pending[2]?.url).toContain("/new.geojson");
		pending[2]!.resolve(collection("polled"));
		await tick();
		expect(current(store)?.ids).toEqual(["polled"]);
	});
});
