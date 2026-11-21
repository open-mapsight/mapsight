import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {createMapsightStore} from "@/index";
import {set} from "@/lib/base/actions";
import {load, setData} from "@/lib/feature-sources/actions";
import {FeatureSourcesController} from "@/lib/feature-sources/controller";
import {getFeatureSourceLoadState} from "@/lib/feature-sources/load-state";
import type {
	FeatureSourceData,
	FeatureSourcesState,
} from "@/lib/feature-sources/types";
import {
	type FeatureSourceStoreLike,
	whenFeatureSourceSettled,
	whenFeatureSourcesSettled,
} from "@/lib/feature-sources/when-settled";

const controllerName = "featureSources";
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
const xhrSource = (url: string, extra: Record<string, unknown> = {}) => ({
	type: "xhr-json" as const,
	url,
	data: null,
	lastUpdate: null,
	lastActionType: null,
	...extra,
});

function createStore(sources: Record<string, object> = {}) {
	return createMapsightStore(
		{[controllerName]: new FeatureSourcesController(controllerName)},
		{},
		{[controllerName]: sources},
	);
}
type Store = ReturnType<typeof createStore>;
function sourceOf(store: Store, id: string) {
	return (store.getState()[controllerName] as FeatureSourcesState)[id];
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
/** Records the outcome of a promise so tests can look at it between ticks. */
function track<T>(promise: Promise<T>) {
	const box: {value?: T; done: boolean} = {done: false};
	void promise.then((value) => {
		box.value = value;
		box.done = true;
	});
	return box;
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

describe("whenFeatureSourcesSettled", () => {
	it("resolves with the data after a successful load", async () => {
		const {pending} = deferredFetch();
		const store = createStore({places: xhrSource("/a.geojson")});
		store.dispatch(load(controllerName, "places"));
		const result = track(
			whenFeatureSourcesSettled(store, controllerName, ["places"]),
		);

		await tick();
		expect(result.done).toBe(false);
		pending[0]!.resolve(collection("a"));
		await tick();

		expect(result.value).toEqual({
			status: "settled",
			sources: {places: "ok"},
		});
		expect(sourceOf(store, "places")?.ids).toEqual(["a"]);
	});

	it("resolves after a failed load", async () => {
		const {pending} = deferredFetch();
		const store = createStore({places: xhrSource("/a.geojson")});
		store.dispatch(load(controllerName, "places"));
		const result = track(
			whenFeatureSourcesSettled(store, controllerName, ["places"]),
		);

		await tick();
		pending[0]!.reject(new Error("boom"));
		await tick();

		expect(result.value).toEqual({
			status: "settled",
			sources: {places: "error"},
		});
	});

	it("resolves after a source without data failed its first load", async () => {
		const store = createStore({places: {type: "noop"}});
		store.dispatch(load(controllerName, "places"));
		const result = track(
			whenFeatureSourcesSettled(store, controllerName, ["places"]),
		);

		await tick();
		expect(result.value).toEqual({
			status: "settled",
			sources: {places: "error"},
		});
		expect(sourceOf(store, "places")?.error).toBe("no data");
	});

	it("resolves immediately when the source is already loaded", async () => {
		const store = createStore({
			places: {type: "noop", data: collection("a")},
		});
		await expect(
			whenFeatureSourcesSettled(store, controllerName, ["places"]),
		).resolves.toEqual({status: "settled", sources: {places: "ok"}});
	});

	it("waits for a freshly added source until its load has finished", async () => {
		const {pending} = deferredFetch();
		const store = createStore({places: xhrSource("/a.geojson")});
		const result = track(
			whenFeatureSourcesSettled(store, controllerName, ["places"]),
		);

		await tick(100);
		expect(sourceOf(store, "places")).toMatchObject({data: null});
		expect(result.done).toBe(false);

		store.dispatch(load(controllerName, "places"));
		await tick();
		expect(sourceOf(store, "places")?.isLoading).toBe(true);
		expect(result.done).toBe(false);

		pending[0]!.resolve(collection("a"));
		await tick();
		expect(result.value?.status).toBe("settled");
	});

	it("waits for a load that is already in flight", async () => {
		const {pending} = deferredFetch();
		const store = createStore({places: xhrSource("/a.geojson")});
		store.dispatch(load(controllerName, "places"));
		await tick();
		expect(sourceOf(store, "places")?.isLoading).toBe(true);

		const result = track(
			whenFeatureSourcesSettled(store, controllerName, ["places"]),
		);
		await tick(100);
		expect(result.done).toBe(false);
		pending[0]!.resolve(collection("a"));
		await tick();
		expect(result.value).toEqual({
			status: "settled",
			sources: {places: "ok"},
		});
	});

	it("reports a source that does not exist as missing", async () => {
		const store = createStore();
		await expect(
			whenFeatureSourcesSettled(store, controllerName, ["nope"]),
		).resolves.toEqual({status: "settled", sources: {nope: "missing"}});
	});

	it("resolves as missing when the source is removed while waiting", async () => {
		deferredFetch();
		const store = createStore({places: xhrSource("/a.geojson")});
		store.dispatch(load(controllerName, "places"));
		await tick();
		const result = track(
			whenFeatureSourcesSettled(store, controllerName, ["places"]),
		);

		store.dispatch(set([controllerName], {}));
		await tick();

		expect(result.value).toEqual({
			status: "settled",
			sources: {places: "missing"},
		});
	});

	it("waits for every listed source", async () => {
		const {pending} = deferredFetch();
		const store = createStore({
			a: xhrSource("/a.geojson"),
			b: xhrSource("/b.geojson"),
		});
		store.dispatch(load(controllerName, "a"));
		store.dispatch(load(controllerName, "b"));
		const result = track(
			whenFeatureSourcesSettled(store, controllerName, ["a", "b", "c"]),
		);

		await tick();
		pending[0]!.resolve(collection("a"));
		await tick();
		expect(result.done).toBe(false);

		pending[1]!.reject(new Error("b failed"));
		await tick();
		expect(result.value).toEqual({
			status: "settled",
			sources: {a: "ok", b: "error", c: "missing"},
		});
	});

	it("resolves for an empty list", async () => {
		await expect(
			whenFeatureSourcesSettled(createStore(), controllerName, []),
		).resolves.toEqual({status: "settled", sources: {}});
	});

	it("accepts a custom condition", async () => {
		const {pending} = deferredFetch();
		const store = createStore({
			a: xhrSource("/a.geojson"),
			b: xhrSource("/b.geojson"),
		});
		store.dispatch(load(controllerName, "a"));
		store.dispatch(load(controllerName, "b"));
		const isSettled = vi.fn((states: Record<string, string>) =>
			Object.values(states).includes("ok"),
		);
		const result = track(
			whenFeatureSourcesSettled(store, controllerName, ["a", "b"], {
				isSettled,
			}),
		);

		await tick();
		expect(result.done).toBe(false);
		pending[1]!.resolve(collection("b"));
		await tick();

		expect(result.value).toEqual({
			status: "settled",
			sources: {a: "loading", b: "ok"},
		});
		expect(isSettled).toHaveBeenLastCalledWith({a: "loading", b: "ok"});
	});

	describe("abort and timeout", () => {
		it("resolves aborted and releases its listeners", async () => {
			deferredFetch();
			const store = createStore({places: xhrSource("/a.geojson")});
			store.dispatch(load(controllerName, "places"));
			await tick();
			const controller = new AbortController();
			const result = track(
				whenFeatureSourcesSettled(store, controllerName, ["places"], {
					signal: controller.signal,
					timeoutMs: 60_000,
				}),
			);
			await tick();
			expect(result.done).toBe(false);

			controller.abort();
			await tick(0);

			expect(result.value).toEqual({
				status: "aborted",
				sources: {places: "loading"},
			});
			expect(vi.getTimerCount()).toBe(0);
		});

		it("resolves aborted for a signal that is already aborted", async () => {
			const store = createStore({
				places: {type: "noop", data: collection("a")},
			});
			const subscribe = vi.spyOn(store, "subscribe");
			await expect(
				whenFeatureSourcesSettled(store, controllerName, ["places"], {
					signal: AbortSignal.abort(),
				}),
			).resolves.toMatchObject({status: "aborted"});
			expect(subscribe).not.toHaveBeenCalled();
		});

		it("resolves with timeout and the current states", async () => {
			deferredFetch();
			const store = createStore({places: xhrSource("/a.geojson")});
			store.dispatch(load(controllerName, "places"));
			const result = track(
				whenFeatureSourcesSettled(store, controllerName, ["places"], {
					timeoutMs: 500,
				}),
			);

			await tick(400);
			expect(result.done).toBe(false);
			await tick(100);
			expect(result.value).toEqual({
				status: "timeout",
				sources: {places: "loading"},
			});
		});

		it("clears the timer and unsubscribes when settled", async () => {
			const {pending} = deferredFetch();
			const store = createStore({places: xhrSource("/a.geojson")});
			store.dispatch(load(controllerName, "places"));
			const unsubscribe = vi.fn();
			const subscribe = vi.fn((listener: () => void) => {
				const stop = store.subscribe(listener);
				return () => {
					unsubscribe();
					stop();
				};
			});
			const getState = vi.fn(() => store.getState());
			const signal = new AbortController().signal;
			const removeListener = vi.spyOn(signal, "removeEventListener");
			const result = track(
				whenFeatureSourcesSettled(
					{getState, subscribe},
					controllerName,
					["places"],
					{timeoutMs: 60_000, signal},
				),
			);

			await tick();
			pending[0]!.resolve(collection("a"));
			await tick();
			expect(result.value?.status).toBe("settled");
			expect(unsubscribe).toHaveBeenCalledTimes(1);
			expect(removeListener).toHaveBeenCalledWith(
				"abort",
				expect.any(Function),
			);
			expect(vi.getTimerCount()).toBe(0);

			// No more reads, whatever happens to the store afterwards.
			const reads = getState.mock.calls.length;
			store.dispatch(setData(controllerName, "places", collection("b")));
			await tick();
			expect(getState).toHaveBeenCalledTimes(reads);
		});
	});

	it("settles a refreshing source on its data, not on its timer", async () => {
		const {pending, fetch} = deferredFetch();
		const store = createStore({
			places: xhrSource("/a.geojson", {doRefresh: true, timer: 60_000}),
		});
		store.dispatch(load(controllerName, "places"));
		const result = track(
			whenFeatureSourcesSettled(store, controllerName, ["places"]),
		);

		await tick();
		pending[0]!.resolve(collection("a"));
		await tick();

		expect(result.value?.status).toBe("settled");
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(vi.getTimerCount()).toBeGreaterThan(0); // the refresh timer
	});

	describe('after: "next-completion"', () => {
		const next = {after: "next-completion"} as const;

		it("does not accept the data that is already there", async () => {
			const {pending} = deferredFetch();
			const store = createStore({
				places: xhrSource("/a.geojson", {data: collection("old")}),
			});
			store.dispatch(
				load(controllerName, "places", {forceRefresh: true}),
			);
			const result = track(
				whenFeatureSourcesSettled(
					store,
					controllerName,
					["places"],
					next,
				),
			);

			// Before the queued load has started the old data must not count.
			expect(sourceOf(store, "places")?.isLoading).toBeFalsy();
			await tick(5);
			expect(result.done).toBe(false);
			await tick();
			expect(sourceOf(store, "places")?.isLoading).toBe(true);
			expect(result.done).toBe(false);

			pending[0]!.resolve(collection("fresh"));
			await tick();
			expect(result.value).toEqual({
				status: "settled",
				sources: {places: "ok"},
			});
			expect(sourceOf(store, "places")?.ids).toEqual(["fresh"]);
		});

		it("settles on a failing refresh of a source that has data", async () => {
			const {pending} = deferredFetch();
			const store = createStore({
				places: xhrSource("/a.geojson", {data: collection("old")}),
			});
			store.dispatch(
				load(controllerName, "places", {forceRefresh: true}),
			);
			const result = track(
				whenFeatureSourcesSettled(
					store,
					controllerName,
					["places"],
					next,
				),
			);

			await tick();
			pending[0]!.reject(new Error("down"));
			await tick();
			expect(result.value).toEqual({
				status: "settled",
				sources: {places: "error"},
			});
		});

		it("settles on a retry of a failed source that fails again", async () => {
			const {pending} = deferredFetch();
			const store = createStore({places: xhrSource("/a.geojson")});
			store.dispatch(load(controllerName, "places"));
			await tick();
			pending[0]!.reject(new Error("down"));
			await tick();
			expect(sourceOf(store, "places")?.error).toBeDefined();

			store.dispatch(
				load(controllerName, "places", {forceRefresh: true}),
			);
			const result = track(
				whenFeatureSourcesSettled(
					store,
					controllerName,
					["places"],
					next,
				),
			);
			await tick();
			expect(sourceOf(store, "places")?.isLoading).toBe(true);
			expect(result.done).toBe(false);

			pending[1]!.reject(new Error("still down"));
			await tick();
			expect(result.value?.sources).toEqual({places: "error"});
		});

		it("does not settle on a request that is already in flight", async () => {
			const {pending} = deferredFetch();
			const store = createStore({
				places: xhrSource("/a.geojson", {data: collection("old")}),
			});
			store.dispatch(
				load(controllerName, "places", {forceRefresh: true}),
			);
			await tick();
			expect(sourceOf(store, "places")?.isLoading).toBe(true);
			const result = track(
				whenFeatureSourcesSettled(store, controllerName, ["places"], {
					...next,
					timeoutMs: 1000,
				}),
			);
			pending[0]!.resolve(collection("fresh"));
			await tick();
			// The request that was running at call time does not count, only a
			// request that starts afterwards does.
			expect(sourceOf(store, "places")?.isLoading).toBe(false);
			expect(result.done).toBe(false);

			await tick(1000);
			expect(result.value).toEqual({
				status: "timeout",
				sources: {places: "loading"},
			});
		});

		it("settles on a request that starts after a request that was in flight", async () => {
			const {pending} = deferredFetch();
			const store = createStore({
				places: xhrSource("/a.geojson", {data: collection("old")}),
			});
			store.dispatch(
				load(controllerName, "places", {forceRefresh: true}),
			);
			await tick();
			const result = track(
				whenFeatureSourcesSettled(
					store,
					controllerName,
					["places"],
					next,
				),
			);
			pending[0]!.resolve(collection("first"));
			await tick();
			expect(result.done).toBe(false);

			store.dispatch(
				load(controllerName, "places", {forceRefresh: true}),
			);
			await tick();
			expect(result.done).toBe(false);
			pending[1]!.resolve(collection("second"));
			await tick();
			expect(result.value?.status).toBe("settled");
			expect(sourceOf(store, "places")?.ids).toEqual(["second"]);
		});

		it("does not settle on the request that completes before a queued refresh starts", async () => {
			const {pending} = deferredFetch();
			const store = createStore({
				places: xhrSource("/a.geojson", {data: collection("old")}),
			});
			store.dispatch(
				load(controllerName, "places", {forceRefresh: true}),
			);
			await tick();
			expect(sourceOf(store, "places")?.isLoading).toBe(true);

			// A forced refresh is dispatched, but it only starts on the next
			// queue run. The wait is requested right behind it.
			store.dispatch(
				load(controllerName, "places", {forceRefresh: true}),
			);
			const result = track(
				whenFeatureSourcesSettled(
					store,
					controllerName,
					["places"],
					next,
				),
			);
			// The first request completes before the queued refresh starts.
			pending[0]!.resolve(collection("first"));
			await tick(0);
			expect(sourceOf(store, "places")?.ids).toEqual(["first"]);
			expect(sourceOf(store, "places")?.isLoading).toBe(false);
			expect(result.done).toBe(false);

			await tick();
			expect(sourceOf(store, "places")?.isLoading).toBe(true);
			expect(result.done).toBe(false);

			pending[1]!.resolve(collection("second"));
			await tick();
			expect(result.value).toEqual({
				status: "settled",
				sources: {places: "ok"},
			});
			expect(sourceOf(store, "places")?.ids).toEqual(["second"]);
		});

		it("settles on a forced refresh that supersedes a pending request", async () => {
			const {pending} = deferredFetch();
			const store = createStore({
				places: xhrSource("/a.geojson", {data: collection("old")}),
			});
			store.dispatch(
				load(controllerName, "places", {forceRefresh: true}),
			);
			await tick();
			const first = sourceOf(store, "places")?.requestId;
			const result = track(
				whenFeatureSourcesSettled(
					store,
					controllerName,
					["places"],
					next,
				),
			);
			store.dispatch(
				load(controllerName, "places", {forceRefresh: true}),
			);
			await tick();
			expect(sourceOf(store, "places")?.requestId).not.toBe(first);
			expect(pending).toHaveLength(2);

			// The superseded request completes late; the reducer drops it.
			pending[0]!.resolve(collection("superseded"));
			await tick();
			expect(sourceOf(store, "places")?.ids).toEqual(["old"]);
			expect(result.done).toBe(false);

			pending[1]!.resolve(collection("fresh"));
			await tick();
			expect(result.value?.status).toBe("settled");
			expect(sourceOf(store, "places")?.ids).toEqual(["fresh"]);
		});

		it("settles on a failing forced refresh that supersedes a pending request", async () => {
			const {pending} = deferredFetch();
			const store = createStore({
				places: xhrSource("/a.geojson", {data: collection("old")}),
			});
			store.dispatch(
				load(controllerName, "places", {forceRefresh: true}),
			);
			await tick();
			const result = track(
				whenFeatureSourcesSettled(
					store,
					controllerName,
					["places"],
					next,
				),
			);
			store.dispatch(
				load(controllerName, "places", {forceRefresh: true}),
			);
			await tick();

			pending[0]!.resolve(collection("superseded"));
			await tick();
			expect(result.done).toBe(false);
			pending[1]!.reject(new Error("down"));
			await tick();
			expect(result.value).toEqual({
				status: "settled",
				sources: {places: "error"},
			});
		});

		it("does not count a source that was removed and re-added as having started", async () => {
			const {pending} = deferredFetch();
			const store = createStore({
				a: xhrSource("/a.geojson", {data: collection("old-a")}),
				b: xhrSource("/b.geojson", {data: collection("old-b")}),
			});
			store.dispatch(load(controllerName, "a", {forceRefresh: true}));
			store.dispatch(load(controllerName, "b", {forceRefresh: true}));
			const result = track(
				whenFeatureSourcesSettled(store, controllerName, ["a", "b"], {
					...next,
					timeoutMs: 60_000,
				}),
			);
			await tick();
			pending[0]!.resolve(collection("a"));
			await tick();
			expect(typeof sourceOf(store, "a")?.requestId).toBe("number");
			expect(result.done).toBe(false);

			// "a" is replaced by a static source that never had a request.
			const b = sourceOf(store, "b");
			store.dispatch(set([controllerName], {b}));
			store.dispatch(
				set([controllerName], {
					a: {type: "noop", data: collection("static")},
					b,
				}),
			);
			pending[1]!.resolve(collection("b"));
			await tick();

			expect(sourceOf(store, "b")?.ids).toEqual(["b"]);
			expect(result.done).toBe(false);
			await tick(60_000);
			expect(result.value).toEqual({
				status: "timeout",
				sources: {a: "loading", b: "ok"},
			});
		});

		it("counts a request of a re-added source that starts after the call", async () => {
			const {pending} = deferredFetch();
			const store = createStore({
				a: xhrSource("/a.geojson", {data: collection("old-a")}),
				b: xhrSource("/b.geojson", {data: collection("old-b")}),
			});
			store.dispatch(load(controllerName, "a", {forceRefresh: true}));
			store.dispatch(load(controllerName, "b", {forceRefresh: true}));
			const result = track(
				whenFeatureSourcesSettled(
					store,
					controllerName,
					["a", "b"],
					next,
				),
			);
			await tick();
			pending[0]!.resolve(collection("a"));
			await tick();

			const b = sourceOf(store, "b");
			store.dispatch(set([controllerName], {b}));
			store.dispatch(
				set([controllerName], {a: xhrSource("/a2.geojson"), b}),
			);
			pending[1]!.resolve(collection("b"));
			await tick();
			expect(result.done).toBe(false);

			store.dispatch(load(controllerName, "a"));
			await tick();
			expect(sourceOf(store, "a")?.isLoading).toBe(true);
			expect(result.done).toBe(false);
			pending[2]!.resolve(collection("a2"));
			await tick();
			expect(result.value).toEqual({
				status: "settled",
				sources: {a: "ok", b: "ok"},
			});
		});

		it("keeps waiting for a load that never starts, until the timeout", async () => {
			const store = createStore({
				places: xhrSource("/a.geojson", {data: collection("old")}),
			});
			const result = track(
				whenFeatureSourcesSettled(store, controllerName, ["places"], {
					...next,
					timeoutMs: 1000,
				}),
			);
			await tick(1000);
			expect(result.value).toEqual({
				status: "timeout",
				sources: {places: "loading"},
			});
		});

		it("does not wait for a source that does not exist", async () => {
			await expect(
				whenFeatureSourcesSettled(
					createStore(),
					controllerName,
					["x"],
					next,
				),
			).resolves.toEqual({status: "settled", sources: {x: "missing"}});
		});
	});
});

describe("whenFeatureSourcesSettled edge cases", () => {
	type FakeStore = FeatureSourceStoreLike & {
		replace(sources: FeatureSourcesState): void;
	};
	/** A store with plain state, for inputs the real reducers do not need to handle. */
	function fakeStore(sources: object): FakeStore {
		let state: Record<string, unknown> = {[controllerName]: sources};
		const listeners = new Set<() => void>();
		return {
			getState: () => state,
			subscribe(listener) {
				listeners.add(listener);
				return () => listeners.delete(listener);
			},
			replace(next) {
				state = {[controllerName]: next};
				[...listeners].forEach((listener) => listener());
			},
		};
	}
	/** An object with an own property of that name, even for `__proto__`. */
	const own = (key: string, value: unknown): FeatureSourcesState =>
		JSON.parse(
			`{${JSON.stringify(key)}: ${JSON.stringify(value)}}`,
		) as FeatureSourcesState;

	describe("changes while the condition runs for the first time", () => {
		it("notices a state change made by the first call", async () => {
			const store = createStore({places: {type: "noop"}});
			let calls = 0;
			const result = track(
				whenFeatureSourcesSettled(store, controllerName, ["places"], {
					timeoutMs: 1000,
					isSettled: (states) => {
						calls++;
						if (calls === 1) {
							store.dispatch(
								setData(
									controllerName,
									"places",
									collection("a"),
								),
							);
							return false;
						}
						return states.places === "ok";
					},
				}),
			);

			await tick(1000);
			expect(result.value).toEqual({
				status: "settled",
				sources: {places: "ok"},
			});
			expect(calls).toBe(2);
			expect(vi.getTimerCount()).toBe(0);
		});

		it("notices an abort raised by the first call", async () => {
			const store = createStore({places: {type: "noop"}});
			const controller = new AbortController();
			const result = track(
				whenFeatureSourcesSettled(store, controllerName, ["places"], {
					signal: controller.signal,
					timeoutMs: 1000,
					isSettled: () => {
						controller.abort();
						return false;
					},
				}),
			);

			await tick(1000);
			expect(result.value).toEqual({
				status: "aborted",
				sources: {places: "idle"},
			});
			expect(vi.getTimerCount()).toBe(0);
		});

		it("does not run the condition re-entrantly", async () => {
			const store = createStore({places: {type: "noop"}});
			let depth = 0;
			let maxDepth = 0;
			let calls = 0;
			const result = track(
				whenFeatureSourcesSettled(store, controllerName, ["places"], {
					timeoutMs: 1000,
					isSettled: (states) => {
						depth++;
						maxDepth = Math.max(maxDepth, depth);
						calls++;
						if (calls <= 2) {
							store.dispatch(
								setData(
									controllerName,
									"places",
									collection(`v${calls}`),
								),
							);
						}
						depth--;
						return calls > 2 && states.places === "ok";
					},
				}),
			);

			await tick(1000);
			expect(result.value?.status).toBe("settled");
			expect(maxDepth).toBe(1);
		});
	});

	describe("ids that look like object properties", () => {
		it("waits for an idle source with the id __proto__", async () => {
			const store = fakeStore(
				own("__proto__", {type: "noop", data: null}),
			);
			const result = track(
				whenFeatureSourcesSettled(
					store,
					controllerName,
					["__proto__"],
					{
						timeoutMs: 1000,
					},
				),
			);
			await tick(0);
			expect(result.done).toBe(false);

			store.replace(
				own("__proto__", {type: "noop", data: collection("a")}),
			);
			await tick(0);
			expect(result.value?.status).toBe("settled");
			expect(Object.keys(result.value!.sources)).toEqual(["__proto__"]);
			expect(result.value!.sources["__proto__"]).toBe("ok");
		});

		it("reports ids that only exist on the prototype chain as missing", async () => {
			const store = fakeStore({});
			const result = await whenFeatureSourcesSettled(
				store,
				controllerName,
				["constructor", "toString", "__proto__"],
			);
			expect(result.status).toBe("settled");
			expect(Object.keys(result.sources)).toEqual([
				"constructor",
				"toString",
				"__proto__",
			]);
			expect(Object.values(result.sources)).toEqual([
				"missing",
				"missing",
				"missing",
			]);
		});

		it("returns the state of a __proto__ source from the single-source form", async () => {
			const store = fakeStore(
				own("__proto__", {type: "noop", data: null}),
			);
			const result = track(
				whenFeatureSourceSettled(store, controllerName, "__proto__", {
					timeoutMs: 100,
				}),
			);
			await tick(100);
			expect(result.value).toEqual({status: "timeout", state: "idle"});
		});
	});

	describe("lists of ids", () => {
		it("resolves settled for an empty list without subscribing", async () => {
			const store = createStore();
			const subscribe = vi.spyOn(store, "subscribe");
			const isSettled = vi.fn(() => false);
			await expect(
				whenFeatureSourcesSettled(store, controllerName, [], {
					isSettled,
				}),
			).resolves.toEqual({status: "settled", sources: {}});
			expect(subscribe).not.toHaveBeenCalled();
			expect(isSettled).not.toHaveBeenCalled();
		});

		it("lets an aborted signal win over an empty list", async () => {
			await expect(
				whenFeatureSourcesSettled(createStore(), controllerName, [], {
					signal: AbortSignal.abort(),
				}),
			).resolves.toEqual({status: "aborted", sources: {}});
		});

		it("treats duplicate ids as one source", async () => {
			const {pending} = deferredFetch();
			const store = createStore({
				a: xhrSource("/a.geojson"),
				b: {type: "noop", data: collection("b")},
			});
			store.dispatch(load(controllerName, "a"));
			const seen: string[][] = [];
			const result = track(
				whenFeatureSourcesSettled(
					store,
					controllerName,
					["a", "b", "a"],
					{
						isSettled: (states) => {
							seen.push(Object.keys(states));
							return Object.values(states).every(
								(state) => state === "ok",
							);
						},
					},
				),
			);
			await tick();
			pending[0]!.resolve(collection("a"));
			await tick();

			expect(result.value).toEqual({
				status: "settled",
				sources: {a: "ok", b: "ok"},
			});
			expect(Object.keys(result.value!.sources)).toEqual(["a", "b"]);
			expect(seen.every((keys) => keys.join() === "a,b")).toBe(true);
		});
	});

	describe("a store that notifies while subscribing", () => {
		it("releases everything when the wait ends inside subscribe", async () => {
			let sources: object = {places: {type: "noop", data: null}};
			const unsubscribe = vi.fn();
			const store: FeatureSourceStoreLike = {
				getState: () => ({[controllerName]: sources}),
				subscribe(listener) {
					sources = {places: {type: "noop", data: collection("a")}};
					listener();
					return unsubscribe;
				},
			};
			const signal = new AbortController().signal;
			const addListener = vi.spyOn(signal, "addEventListener");
			const removeListener = vi.spyOn(signal, "removeEventListener");

			const result = await whenFeatureSourcesSettled(
				store,
				controllerName,
				["places"],
				{signal, timeoutMs: 60_000},
			);

			expect(result).toEqual({
				status: "settled",
				sources: {places: "ok"},
			});
			expect(unsubscribe).toHaveBeenCalledTimes(1);
			expect(vi.getTimerCount()).toBe(0);
			// Either never added, or added and removed again.
			expect(addListener.mock.calls.length).toBe(
				removeListener.mock.calls.length,
			);
		});
	});
});

describe("whenFeatureSourceSettled", () => {
	it("resolves with the state of the one source", async () => {
		const {pending} = deferredFetch();
		const store = createStore({places: xhrSource("/a.geojson")});
		store.dispatch(load(controllerName, "places"));
		const result = track(
			whenFeatureSourceSettled(store, controllerName, "places"),
		);
		await tick();
		pending[0]!.resolve(collection("a"));
		await tick();
		expect(result.value).toEqual({status: "settled", state: "ok"});
	});

	it("reports missing, timeout and a state-based condition", async () => {
		const store = createStore({places: xhrSource("/a.geojson")});
		await expect(
			whenFeatureSourceSettled(store, controllerName, "nope"),
		).resolves.toEqual({status: "settled", state: "missing"});

		await expect(
			whenFeatureSourceSettled(store, controllerName, "places", {
				isSettled: (state) => state === "idle",
			}),
		).resolves.toEqual({status: "settled", state: "idle"});

		const timedOut = track(
			whenFeatureSourceSettled(store, controllerName, "places", {
				timeoutMs: 50,
			}),
		);
		await tick(50);
		expect(timedOut.value).toEqual({status: "timeout", state: "idle"});
	});
});

describe("getFeatureSourceLoadState against the controller", () => {
	function stateOf(store: Store, id: string) {
		return getFeatureSourceLoadState(sourceOf(store, id));
	}

	it("walks a source through idle, loading and ok or error", async () => {
		const {pending} = deferredFetch();
		const store = createStore({
			a: xhrSource("/a.geojson"),
			b: xhrSource("/b.geojson"),
		});
		expect(stateOf(store, "a")).toBe("idle");
		expect(stateOf(store, "nope")).toBe("missing");

		store.dispatch(load(controllerName, "a"));
		store.dispatch(load(controllerName, "b"));
		await tick();
		expect(stateOf(store, "a")).toBe("loading");
		pending[0]!.resolve({type: "FeatureCollection", features: []});
		pending[1]!.reject(new Error("down"));
		await tick();
		expect(stateOf(store, "a")).toBe("ok");
		expect(stateOf(store, "b")).toBe("error");
	});

	it("counts a retry as loading although the old error is still in state", async () => {
		const {pending} = deferredFetch();
		const store = createStore({a: xhrSource("/a.geojson")});
		store.dispatch(load(controllerName, "a"));
		await tick();
		pending[0]!.reject(new Error("down"));
		await tick();
		store.dispatch(load(controllerName, "a", {forceRefresh: true}));
		await tick();
		expect(sourceOf(store, "a")?.error).toBeDefined();
		expect(stateOf(store, "a")).toBe("loading");
	});

	it("treats a noop source with data as ok and one without as an error after its load", async () => {
		const store = createStore({
			withData: {type: "noop", data: collection("a")},
			without: {type: "noop"},
		});
		expect(stateOf(store, "withData")).toBe("ok");
		expect(stateOf(store, "without")).toBe("idle");
		store.dispatch(load(controllerName, "without"));
		await tick();
		expect(stateOf(store, "without")).toBe("error");
	});

	it("fills a combined source from its members without a load", async () => {
		const store = createStore({
			a: {type: "noop", data: collection("a")},
			both: {type: "combined", featureSourceNames: ["a", "later"]},
		});
		await tick();
		expect(stateOf(store, "both")).toBe("ok");
		expect(sourceOf(store, "both")?.ids).toEqual(["a"]);
	});
});
