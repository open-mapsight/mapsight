import type {Middleware} from "@reduxjs/toolkit";
import {applyMiddleware} from "@reduxjs/toolkit";
import {afterEach, describe, expect, it, vi} from "vitest";

import {createMapsightStore} from "@/index";
import {
	LOAD_FEATURE_SOURCE,
	LOAD_FEATURE_SOURCE_ERROR,
	LOAD_FEATURE_SOURCE_SUCCESS,
	USE_CACHE_ONLY,
	load,
} from "@/lib/feature-sources/actions";
import {buildCacheKey} from "@/lib/feature-sources/cache/build-cache-key";
import {createMemoryFeatureSourceCache} from "@/lib/feature-sources/cache/memory-cache";
import {purgeDocumentCacheEntries} from "@/lib/feature-sources/cache/purge";
import {FeatureSourcesController} from "@/lib/feature-sources/controller";
import {ERROR_COLD_CACHE} from "@/lib/feature-sources/selectors";
import type {FeatureSourcesState} from "@/lib/feature-sources/types";

const controllerName = "featureSources";

describe("load", () => {
	it("does not retry immediately after a failed load", async () => {
		const dispatch = vi.fn();
		const getState = () =>
			({
				[controllerName]: {
					hotels: {
						type: "xhr-json",
						url: "/missing.geojson",
						isLoading: false,
						error: "Not Found",
						data: null,
						lastUpdate: null,
						lastActionType: null,
					},
				},
			}) as Record<string, FeatureSourcesState>;

		const thunk = load(controllerName, "hotels");
		await thunk(dispatch, getState, undefined);

		expect(dispatch).not.toHaveBeenCalled();
	});

	it("does not retry immediately after a failed load with an empty error message", async () => {
		const dispatch = vi.fn();
		const getState = () =>
			({
				[controllerName]: {
					hotels: {
						type: "xhr-json",
						url: "/missing.geojson",
						isLoading: false,
						error: "",
						data: null,
						lastUpdate: null,
						lastActionType: null,
					},
				},
			}) as Record<string, FeatureSourcesState>;

		const thunk = load(controllerName, "hotels");
		await thunk(dispatch, getState, undefined);

		expect(dispatch).not.toHaveBeenCalled();
	});

	it("retries a failed load when forceRefresh is set", async () => {
		const dispatch = vi.fn();
		const getState = () =>
			({
				[controllerName]: {
					hotels: {
						type: "xhr-json",
						url: "/missing.geojson",
						isLoading: false,
						error: "Not Found",
						data: null,
						lastUpdate: null,
						lastActionType: null,
						requestId: 1,
					},
				},
			}) as Record<string, FeatureSourcesState>;

		const thunk = load(controllerName, "hotels", {forceRefresh: true});
		await thunk(dispatch, getState, undefined);

		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: LOAD_FEATURE_SOURCE,
				id: "hotels",
			}),
		);
	});
});

const schoolsCollection = {
	type: "FeatureCollection" as const,
	features: [
		{
			id: "school-1",
			type: "Feature" as const,
			properties: {title: "Schule"},
			geometry: {type: "Point" as const, coordinates: [10, 52]},
		},
	],
};

function emptyHeaders() {
	return {get: () => null};
}

function xhrJsonState(
	overrides: Partial<FeatureSourcesState[string]> = {},
): Record<string, FeatureSourcesState> {
	return {
		[controllerName]: {
			schools: {
				type: "xhr-json",
				url: "/geojson/schools.geojson",
				isLoading: false,
				data: null,
				lastUpdate: null,
				lastActionType: null,
				...overrides,
			},
		},
	};
}

describe("load with FeatureSourceCache", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("promotes a memory cache hit without fetching", async () => {
		const cache = createMemoryFeatureSourceCache();
		const key = buildCacheKey({
			controllerName,
			featureSourceId: "schools",
			url: "/geojson/schools.geojson",
			appVersion: "rev-1",
		});
		await cache.put(key, {
			data: schoolsCollection,
			fetchedAt: Date.now(),
			bytes: 10,
		});

		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		const dispatch = vi.fn();
		const thunk = load(controllerName, "schools");
		await thunk(dispatch, () => xhrJsonState(), {
			featureSourceCache: cache,
			featureSourceRevision: "rev-1",
		});

		expect(fetchMock).not.toHaveBeenCalled();
		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: LOAD_FEATURE_SOURCE_SUCCESS,
				id: "schools",
				data: schoolsCollection,
			}),
		);
	});

	it("writes through after a network load", async () => {
		const cache = createMemoryFeatureSourceCache();
		vi.stubGlobal(
			"fetch",
			vi.fn(() => ({
				ok: true,
				status: 200,
				headers: emptyHeaders(),
				json: () => Promise.resolve(schoolsCollection),
			})),
		);

		const dispatch = vi.fn();
		const thunk = load(controllerName, "schools");
		await thunk(dispatch, () => xhrJsonState(), {
			featureSourceCache: cache,
			featureSourceRevision: "rev-1",
		});

		const key = buildCacheKey({
			controllerName,
			featureSourceId: "other-placement",
			url: "/geojson/schools.geojson",
			appVersion: "rev-1",
		});
		expect((await cache.get(key))?.data).toEqual(schoolsCollection);
	});

	it("does not serve a previous revision after the token changes", async () => {
		const cache = createMemoryFeatureSourceCache();
		const staleKey = buildCacheKey({
			controllerName,
			featureSourceId: "schools",
			url: "/geojson/schools.geojson",
			appVersion: "rev-1",
		});
		await cache.put(staleKey, {
			data: schoolsCollection,
			fetchedAt: 1,
			bytes: 10,
		});

		const fetchMock = vi.fn(() => ({
			ok: true,
			status: 200,
			headers: emptyHeaders(),
			json: () =>
				Promise.resolve({
					type: "FeatureCollection",
					features: [],
				}),
		}));
		vi.stubGlobal("fetch", fetchMock);

		const dispatch = vi.fn();
		const thunk = load(controllerName, "schools");
		await thunk(dispatch, () => xhrJsonState(), {
			featureSourceCache: cache,
			featureSourceRevision: "rev-2",
		});

		expect(fetchMock).toHaveBeenCalledOnce();
	});

	it("throws ERROR_COLD_CACHE when USE_CACHE_ONLY misses both Redux and memory", async () => {
		const cache = createMemoryFeatureSourceCache();
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		const dispatch = vi.fn();
		const thunk = load(controllerName, "schools", {
			useCache: USE_CACHE_ONLY,
		});
		await thunk(dispatch, () => xhrJsonState(), {
			featureSourceCache: cache,
		});

		expect(fetchMock).not.toHaveBeenCalled();
		const failure = dispatch.mock.calls
			.map(([action]) => action as {type?: string; error?: Error})
			.find((action) => action.type === LOAD_FEATURE_SOURCE_ERROR);
		expect(failure?.error).toBeInstanceOf(Error);
		expect(failure?.error?.message).toBe(ERROR_COLD_CACHE);
	});

	it("serves Redux data for USE_CACHE_ONLY when the document cache is cold", async () => {
		const cache = createMemoryFeatureSourceCache();
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		const dispatch = vi.fn();
		await load(controllerName, "schools", {useCache: USE_CACHE_ONLY})(
			dispatch,
			() => xhrJsonState({data: schoolsCollection, lastUpdate: 1}),
			{featureSourceCache: cache},
		);

		expect(fetchMock).not.toHaveBeenCalled();
		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: LOAD_FEATURE_SOURCE_SUCCESS,
				data: schoolsCollection,
			}),
		);
	});

	it("single-flights concurrent misses for the same document", async () => {
		const cache = createMemoryFeatureSourceCache();
		let resolveFetch: (value: {
			ok: boolean;
			status: number;
			headers: {get: () => null};
			json: () => Promise<typeof schoolsCollection>;
		}) => void;
		const fetchStarted = new Promise<void>((resolveStarted) => {
			vi.stubGlobal(
				"fetch",
				vi.fn(
					() =>
						new Promise((resolve) => {
							resolveStarted();
							resolveFetch = resolve;
						}),
				),
			);
		});

		const extra = {
			featureSourceCache: cache,
			featureSourceRevision: "rev-1",
		};
		const first = load(controllerName, "schools")(
			vi.fn(),
			() => xhrJsonState(),
			extra,
		);
		await fetchStarted;
		const second = load(controllerName, "schools")(
			vi.fn(),
			() => xhrJsonState(),
			extra,
		);

		resolveFetch!({
			ok: true,
			status: 200,
			headers: emptyHeaders(),
			json: () => Promise.resolve(schoolsCollection),
		});
		await Promise.all([first, second]);

		expect(fetch).toHaveBeenCalledOnce();
	});

	it("does not put a fetch that started before purge", async () => {
		const cache = createMemoryFeatureSourceCache();
		let resolveFetch: (value: {
			ok: boolean;
			status: number;
			headers: {get: () => null};
			json: () => Promise<typeof schoolsCollection>;
		}) => void;
		const fetchStarted = new Promise<void>((resolveStarted) => {
			vi.stubGlobal(
				"fetch",
				vi.fn(
					() =>
						new Promise((resolve) => {
							resolveStarted();
							resolveFetch = resolve;
						}),
				),
			);
		});

		const extra = {
			featureSourceCache: cache,
			featureSourceRevision: "rev-1",
		};
		const pending = load(controllerName, "schools")(
			vi.fn(),
			() => xhrJsonState(),
			extra,
		);
		await fetchStarted;
		await purgeDocumentCacheEntries(cache, ["/geojson/schools.geojson"]);

		resolveFetch!({
			ok: true,
			status: 200,
			headers: emptyHeaders(),
			json: () => Promise.resolve(schoolsCollection),
		});
		await pending;

		const key = buildCacheKey({
			controllerName,
			featureSourceId: "schools",
			url: "/geojson/schools.geojson",
			appVersion: "rev-1",
		});
		expect(await cache.get(key)).toBeNull();
	});

	it("serves stale-while-revalidate immediately and revalidates in the background", async () => {
		const cache = createMemoryFeatureSourceCache();
		const key = buildCacheKey({
			controllerName,
			featureSourceId: "schools",
			url: "/geojson/schools.geojson",
		});
		await cache.put(key, {
			data: schoolsCollection,
			fetchedAt: Date.now() - 1000,
			bytes: 10,
			etag: '"v1"',
			cacheControl: "max-age=0, stale-while-revalidate=60",
		});

		let resolveFetch: (value: unknown) => void = () => undefined;
		const fetchStarted = new Promise<void>((resolveStarted) => {
			vi.stubGlobal(
				"fetch",
				vi.fn(
					() =>
						new Promise((resolve) => {
							resolveStarted();
							resolveFetch = resolve;
						}),
				),
			);
		});

		const dispatch = vi.fn();
		const loaded = load(controllerName, "schools")(
			dispatch,
			() => xhrJsonState(),
			{featureSourceCache: cache},
		);
		await loaded;
		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: LOAD_FEATURE_SOURCE_SUCCESS,
				data: schoolsCollection,
			}),
		);

		await fetchStarted;
		resolveFetch({
			ok: true,
			status: 200,
			headers: {
				get(name: string) {
					return name === "ETag" ? '"v2"' : null;
				},
			},
			json: () =>
				Promise.resolve({
					type: "FeatureCollection",
					features: [],
				}),
		});
		await vi.waitFor(async () => {
			expect((await cache.get(key))?.etag).toBe('"v2"');
		});
	});

	it("blocks on must-revalidate and sends If-None-Match", async () => {
		const cache = createMemoryFeatureSourceCache();
		const key = buildCacheKey({
			controllerName,
			featureSourceId: "schools",
			url: "/geojson/schools.geojson",
		});
		await cache.put(key, {
			data: schoolsCollection,
			fetchedAt: Date.now() - 1000,
			bytes: 10,
			etag: '"v1"',
			cacheControl: "max-age=0, must-revalidate",
		});

		const fetchMock = vi.fn(() => ({
			ok: false,
			status: 304,
			headers: {
				get(name: string) {
					return name === "ETag" ? '"v1"' : null;
				},
			},
		}));
		vi.stubGlobal("fetch", fetchMock);

		const dispatch = vi.fn();
		await load(controllerName, "schools")(dispatch, () => xhrJsonState(), {
			featureSourceCache: cache,
		});

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("/geojson/schools.geojson"),
			expect.objectContaining({
				headers: {"If-None-Match": '"v1"'},
			}),
		);
		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: LOAD_FEATURE_SOURCE_SUCCESS,
				data: schoolsCollection,
			}),
		);
	});

	it("revalidates the document cache even when Redux already has data", async () => {
		const cache = createMemoryFeatureSourceCache();
		const key = buildCacheKey({
			controllerName,
			featureSourceId: "schools",
			url: "/geojson/schools.geojson",
		});
		await cache.put(key, {
			data: schoolsCollection,
			fetchedAt: Date.now() - 1000,
			bytes: 10,
			etag: '"v1"',
			cacheControl: "max-age=0, must-revalidate",
		});

		const fetchMock = vi.fn(() => ({
			ok: false,
			status: 304,
			headers: {
				get(name: string) {
					return name === "ETag" ? '"v1"' : null;
				},
			},
		}));
		vi.stubGlobal("fetch", fetchMock);

		const dispatch = vi.fn();
		await load(controllerName, "schools")(
			dispatch,
			() => xhrJsonState({data: schoolsCollection, lastUpdate: 1}),
			{featureSourceCache: cache},
		);

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("/geojson/schools.geojson"),
			expect.objectContaining({
				headers: {"If-None-Match": '"v1"'},
			}),
		);
	});

	it("ignores a non-adapter featureSourceCache and loads from the network", async () => {
		const fetchMock = vi.fn(() => ({
			ok: true,
			status: 200,
			headers: emptyHeaders(),
			json: () => Promise.resolve(schoolsCollection),
		}));
		vi.stubGlobal("fetch", fetchMock);

		const dispatch = vi.fn();
		await load(controllerName, "schools")(dispatch, () => xhrJsonState(), {
			featureSourceCache: true as never,
		});

		expect(fetchMock).toHaveBeenCalledOnce();
		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: LOAD_FEATURE_SOURCE_SUCCESS,
				data: schoolsCollection,
			}),
		);
	});

	it("still returns origin data when cache.put rejects", async () => {
		const inner = createMemoryFeatureSourceCache();
		const cache = {
			get: inner.get.bind(inner),
			put: () => Promise.reject(new Error("quota")),
			delete: inner.delete.bind(inner),
			estimateTotalBytes: inner.estimateTotalBytes.bind(inner),
			evictLRU: inner.evictLRU.bind(inner),
		};
		vi.stubGlobal(
			"fetch",
			vi.fn(() => ({
				ok: true,
				status: 200,
				headers: emptyHeaders(),
				json: () => Promise.resolve(schoolsCollection),
			})),
		);
		const dispatch = vi.fn();
		await load(controllerName, "schools")(dispatch, () => xhrJsonState(), {
			featureSourceCache: cache,
		});
		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: LOAD_FEATURE_SOURCE_SUCCESS,
				data: schoolsCollection,
			}),
		);
	});

	it("treats a rejected cache.get as a miss", async () => {
		const cache = {
			get: () => Promise.reject(new Error("idb")),
			put: vi.fn(() => Promise.resolve()),
			delete: vi.fn(() => Promise.resolve()),
			estimateTotalBytes: () => Promise.resolve(0),
			evictLRU: () => Promise.resolve([]),
		};
		const fetchMock = vi.fn(() => ({
			ok: true,
			status: 200,
			headers: emptyHeaders(),
			json: () => Promise.resolve(schoolsCollection),
		}));
		vi.stubGlobal("fetch", fetchMock);
		const dispatch = vi.fn();
		await load(controllerName, "schools")(dispatch, () => xhrJsonState(), {
			featureSourceCache: cache,
		});
		expect(fetchMock).toHaveBeenCalledOnce();
		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: LOAD_FEATURE_SOURCE_SUCCESS,
				data: schoolsCollection,
			}),
		);
	});

	it("does not serve stale-if-error for HTTP 404", async () => {
		const cache = createMemoryFeatureSourceCache();
		const key = buildCacheKey({
			controllerName,
			featureSourceId: "schools",
			url: "/geojson/schools.geojson",
		});
		await cache.put(key, {
			data: schoolsCollection,
			fetchedAt: Date.now() - 120_000,
			bytes: 10,
			cacheControl: "max-age=60, stale-if-error=3600",
		});
		vi.stubGlobal(
			"fetch",
			vi.fn(() => ({
				ok: false,
				status: 404,
				statusText: "Not Found",
				headers: {get: () => null},
			})),
		);
		const dispatch = vi.fn();
		await load(controllerName, "schools")(dispatch, () => xhrJsonState(), {
			featureSourceCache: cache,
		});
		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({type: LOAD_FEATURE_SOURCE_ERROR}),
		);
		expect(dispatch).not.toHaveBeenCalledWith(
			expect.objectContaining({
				type: LOAD_FEATURE_SOURCE_SUCCESS,
				data: schoolsCollection,
			}),
		);
	});

	it("serves stale-if-error for HTTP 503", async () => {
		const cache = createMemoryFeatureSourceCache();
		const key = buildCacheKey({
			controllerName,
			featureSourceId: "schools",
			url: "/geojson/schools.geojson",
		});
		await cache.put(key, {
			data: schoolsCollection,
			fetchedAt: Date.now() - 120_000,
			bytes: 10,
			cacheControl: "max-age=60, stale-if-error=3600",
		});
		vi.stubGlobal(
			"fetch",
			vi.fn(() => ({
				ok: false,
				status: 503,
				statusText: "Service Unavailable",
				headers: {get: () => null},
			})),
		);
		const dispatch = vi.fn();
		await load(controllerName, "schools")(dispatch, () => xhrJsonState(), {
			featureSourceCache: cache,
		});
		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: LOAD_FEATURE_SOURCE_SUCCESS,
				data: schoolsCollection,
			}),
		);
	});

	it("reaches load() extraArgument even when redux-thunk is the app enhancer", async () => {
		const cache = createMemoryFeatureSourceCache();
		const key = buildCacheKey({
			controllerName,
			featureSourceId: "schools",
			url: "/geojson/schools.geojson",
			appVersion: "rev-1",
		});
		await cache.put(key, {
			data: schoolsCollection,
			fetchedAt: Date.now(),
			bytes: 10,
		});

		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		const thunkWithoutExtra: Middleware =
			({dispatch, getState}) =>
			(next) =>
			(action) => {
				if (typeof action === "function") {
					return (
						action as (
							dispatch: unknown,
							getState: unknown,
						) => unknown
					)(dispatch, getState);
				}
				return next(action);
			};

		const store = createMapsightStore(
			{featureSources: new FeatureSourcesController("featureSources")},
			{},
			xhrJsonState(),
			applyMiddleware(thunkWithoutExtra),
			{
				extraArgument: {
					featureSourceCache: cache,
					featureSourceRevision: "rev-1",
				},
			},
		);

		store.dispatch(load(controllerName, "schools"));

		await vi.waitFor(() => {
			expect(
				(
					store.getState() as {
						featureSources: FeatureSourcesState;
					}
				).featureSources.schools?.data,
			).toEqual(schoolsCollection);
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
