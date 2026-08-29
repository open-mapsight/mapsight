import {afterEach, describe, expect, it, vi} from "vitest";

import {
	LOAD_FEATURE_SOURCE,
	LOAD_FEATURE_SOURCE_ERROR,
	LOAD_FEATURE_SOURCE_SUCCESS,
	USE_CACHE_ONLY,
	load,
} from "@/lib/feature-sources/actions";
import {buildCacheKey} from "@/lib/feature-sources/cache/build-cache-key";
import {createMemoryFeatureSourceCache} from "@/lib/feature-sources/cache/memory-cache";
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
			key,
			data: schoolsCollection,
			fetchedAt: 1,
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
			key: staleKey,
			data: schoolsCollection,
			fetchedAt: 1,
			bytes: 10,
		});

		const fetchMock = vi.fn(() => ({
			ok: true,
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

	it("single-flights concurrent misses for the same document", async () => {
		const cache = createMemoryFeatureSourceCache();
		let resolveFetch: (value: {
			ok: boolean;
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
			json: () => Promise.resolve(schoolsCollection),
		});
		await Promise.all([first, second]);

		expect(fetch).toHaveBeenCalledOnce();
	});
});
