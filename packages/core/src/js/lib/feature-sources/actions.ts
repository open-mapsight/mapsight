import {async, controlled, withPath} from "@/lib/base/actions";
import {buildCacheKey} from "@/lib/feature-sources/cache/build-cache-key";
import {estimateFeatureSourceBytes} from "@/lib/feature-sources/cache/estimate-bytes";
import {
	allowsStaleOnError,
	correctedInitialAgeSec,
	evaluateFreshness,
	shouldPersistDocumentCache,
} from "@/lib/feature-sources/cache/http-freshness";
import {
	type CacheWriteGeneration,
	captureCacheWriteGeneration,
	isCacheWriteGenerationCurrent,
	singleFlight,
	withDocumentCacheWrite,
} from "@/lib/feature-sources/cache/single-flight";
import type {
	FeatureSourceCache,
	FeatureSourceCacheEntry,
	FeatureSourceCacheExtra,
} from "@/lib/feature-sources/cache/types";
import * as combined from "@/lib/feature-sources/loaders/combined-loader";
import * as local from "@/lib/feature-sources/loaders/local-state-loader";
import type {LocalStateLoaderOptions} from "@/lib/feature-sources/loaders/local-state-loader";
import * as noop from "@/lib/feature-sources/loaders/noop-loader";
import * as xhrJson from "@/lib/feature-sources/loaders/xhr-json-loader";
import {
	ERROR_COLD_CACHE,
	getIsDue,
	hasFeatureSourceLoadError,
} from "@/lib/feature-sources/selectors";
import type {
	FeatureSourceData,
	FeatureSourceState,
	FeatureSourceType,
	FeatureSourcesState,
} from "@/lib/feature-sources/types";
import type {Feature, FeatureId, Geometry, ThunkAction} from "@/types";

function getLoader(type: FeatureSourceType) {
	switch (type) {
		case "local":
			return local;
		case "xhr-json":
			return xhrJson;
		case "combined":
			return combined;
		default:
			return noop;
	}
}

export const FEATURE_SOURCE_DATA = "MAPSIGHT_FEATURE_SOURCE_DATA";
export const FEATURE_SOURCE_DATA_UNDO = "MAPSIGHT_FEATURE_SOURCE_DATA_UNDO";
export const FEATURE_SOURCE_DATA_REDO = "MAPSIGHT_FEATURE_SOURCE_DATA_REDO";
export const FEATURE_SOURCE_DATA_ADD_FEATURE =
	"MAPSIGHT_FEATURE_SOURCE_DATA_ADD_FEATURE";
export const FEATURE_SOURCE_DATA_ADD_FEATURES =
	"MAPSIGHT_FEATURE_SOURCE_DATA_ADD_FEATURES";
export const FEATURE_SOURCE_DATA_UPDATE_FEATURE =
	"MAPSIGHT_FEATURE_SOURCE_DATA_UPDATE_FEATURE";
export const FEATURE_SOURCE_DATA_UPDATE_FEATURE_PROPERTY =
	"MAPSIGHT_FEATURE_SOURCE_DATA_UPDATE_FEATURE_PROPERTY";
export const FEATURE_SOURCE_DATA_UPDATE_FEATURE_GEOMETRY =
	"MAPSIGHT_FEATURE_SOURCE_DATA_UPDATE_FEATURE_GEOMETRY";
export const FEATURE_SOURCE_DATA_REMOVE_FEATURE =
	"MAPSIGHT_FEATURE_SOURCE_DATA_REMOVE_FEATURE";
export const FEATURE_SOURCE_DATA_REMOVE_FEATURES =
	"MAPSIGHT_FEATURE_SOURCE_DATA_REMOVE_FEATURES";
export const FEATURE_SOURCE_DATA_UPDATE_FEATURES =
	"MAPSIGHT_FEATURE_SOURCE_DATA_UPDATE_FEATURES";
export const FEATURE_SOURCE_DATA_REMOVE_ALL_FEATURES =
	"MAPSIGHT_FEATURE_SOURCE_DATA_REMOVE_ALL_FEATURES";
export const FEATURE_SOURCE_ERROR = "MAPSIGHT_FEATURE_SOURCE_ERROR";

export const LOAD_FEATURE_SOURCE = "MAPSIGHT_LOAD_FEATURE_SOURCE";
export const LOAD_FEATURE_SOURCE_SUCCESS =
	"MAPSIGHT_LOAD_FEATURE_SOURCE_SUCCESS";
export const LOAD_FEATURE_SOURCE_ERROR = "MAPSIGHT_LOAD_FEATURE_SOURCE_ERROR";
export const PAUSE_FEATURE_SOURCE_REFRESH_UNTIL_NEXT_LOAD =
	"MAPSIGHT_PAUSE_FEATURE_SOURCE_REFRESH_UNTIL_NEXT_LOAD";

export const USE_CACHE_ONLY = "only";
export const USE_CACHE_NO = false;
export const USE_CACHE_YES = true;

type SharedLoadOptions = {
	forceRefresh?: boolean;
	useCache?:
		typeof USE_CACHE_YES | typeof USE_CACHE_NO | typeof USE_CACHE_ONLY;
};

export type LoadOptions =
	SharedLoadOptions | (LocalStateLoaderOptions & SharedLoadOptions);

type FeatureSourceMutationOptions = unknown;

export const undo = (controllerName: string, id: string) =>
	withPath(
		{
			type: FEATURE_SOURCE_DATA_UNDO,
			id: id,
		},
		[controllerName],
	);

export const redo = (controllerName: string, id: string) =>
	withPath(
		{
			type: FEATURE_SOURCE_DATA_REDO,
			id: id,
		},
		[controllerName],
	);

export const addFeature = (
	controllerName: string,
	sourceId: string,
	feature: Feature,
	options?: FeatureSourceMutationOptions,
) =>
	controlled(
		withPath(
			{
				type: FEATURE_SOURCE_DATA_ADD_FEATURE,
				id: sourceId,
				feature: feature,
				options: options,
			},
			[controllerName],
		),
	);

export const updateFeature = (
	controllerName: string,
	sourceId: string,
	featureId: FeatureId,
	feature: Feature,
	options?: FeatureSourceMutationOptions,
) =>
	controlled(
		withPath(
			{
				type: FEATURE_SOURCE_DATA_UPDATE_FEATURE,
				id: sourceId,
				featureId: featureId,
				feature: feature,
				options: options,
			},
			[controllerName],
		),
	);

export const updateFeatureProperty = (
	controllerName: string,
	sourceId: string,
	featureId: FeatureId,
	propertyId: string,
	value: unknown,
	options: FeatureSourceMutationOptions,
) =>
	controlled(
		withPath(
			{
				type: FEATURE_SOURCE_DATA_UPDATE_FEATURE_PROPERTY,
				id: sourceId,
				featureId: featureId,
				propertyId: propertyId,
				value: value,
				options: options,
			},
			[controllerName],
		),
	);

export const updateFeatures = (
	controllerName: string,
	id: string,
	features: Array<Feature>,
	options?: FeatureSourceMutationOptions,
) =>
	controlled(
		withPath(
			{
				type: FEATURE_SOURCE_DATA_UPDATE_FEATURES,
				id: id,
				features: features,
				options: options,
			},
			[controllerName],
		),
	);

export const updateFeatureGeometry = (
	controllerName: string,
	id: string,
	featureId: FeatureId,
	geometry: Geometry,
	options?: FeatureSourceMutationOptions,
) =>
	controlled(
		withPath(
			{
				type: FEATURE_SOURCE_DATA_UPDATE_FEATURE_GEOMETRY,
				id: id,
				featureId: featureId,
				geometry: geometry,
				options: options,
			},
			[controllerName],
		),
	);

export const addFeatures = (
	controllerName: string,
	id: string,
	features: Array<Feature>,
	options?: FeatureSourceMutationOptions,
) =>
	controlled(
		withPath(
			{
				type: FEATURE_SOURCE_DATA_ADD_FEATURES,
				id: id,
				features: features,
				options: options,
			},
			[controllerName],
		),
	);

export const removeFeature = (
	controllerName: string,
	id: string,
	featureId: string,
	options?: FeatureSourceMutationOptions,
) =>
	controlled(
		withPath(
			{
				type: FEATURE_SOURCE_DATA_REMOVE_FEATURE,
				id: id,
				featureId: featureId,
				options: options,
			},
			[controllerName],
		),
	);

export const removeFeatures = (
	controllerName: string,
	id: string,
	featureIds: Array<FeatureId>,
	options?: FeatureSourceMutationOptions,
) =>
	controlled(
		withPath(
			{
				type: FEATURE_SOURCE_DATA_REMOVE_FEATURES,
				id: id,
				featureIds: featureIds,
				options: options,
			},
			[controllerName],
		),
	);

export const removeAllFeatures = (
	controllerName: string,
	id: string,
	options?: FeatureSourceMutationOptions,
) =>
	controlled(
		withPath(
			{
				type: FEATURE_SOURCE_DATA_REMOVE_ALL_FEATURES,
				id: id,
				options: options,
			},
			[controllerName],
		),
	);

export const setData = (controllerName: string, id: string, data: unknown) =>
	withPath(
		{
			type: FEATURE_SOURCE_DATA,
			id: id,
			data: data,
		},
		[controllerName],
	);

export const setError = (controllerName: string, id: string, error: unknown) =>
	withPath(
		{
			type: FEATURE_SOURCE_ERROR,
			id: id,
			error: error,
		},
		[controllerName],
	);

export const pauseRefreshUntilNextLoad = (controllerName: string, id: string) =>
	withPath(
		{
			type: PAUSE_FEATURE_SOURCE_REFRESH_UNTIL_NEXT_LOAD,
			id: id,
		},
		[controllerName],
	);

export const loadSuccess = (
	controllerName: string,
	id: string,
	data: unknown,
) =>
	async(
		withPath(
			{
				type: LOAD_FEATURE_SOURCE_SUCCESS,
				id: id,
				data: data,
			},
			[controllerName],
		),
	);

export const loadFailure = (
	controllerName: string,
	id: string,
	error: unknown,
) =>
	async(
		withPath(
			{
				type: LOAD_FEATURE_SOURCE_ERROR,
				id: id,
				error: error,
			},
			[controllerName],
		),
	);

export const load = (
	controllerName: string,
	id: string,
	options?: LoadOptions,
) => {
	const handleLoad: ThunkAction = (dispatch, getState, extraArgument) => {
		const state = getState()[controllerName] as FeatureSourcesState;
		const currentState = state[id] || ({} as FeatureSourceState);
		const {requestId = 0, isLoading} = currentState || {};
		if (isLoading && !options?.forceRefresh) {
			return Promise.resolve(); // already loading
		}

		// Failed loads must not be retried immediately. Refreshing sources retry
		// via refreshByTimer with forceRefresh; other callers may pass forceRefresh.
		if (hasFeatureSourceLoadError(currentState) && !options?.forceRefresh) {
			return Promise.resolve();
		}

		const nextRequestId = requestId + 1;

		dispatch(
			withPath(
				{
					type: LOAD_FEATURE_SOURCE,
					id: id,
					options: options,
					requestId: nextRequestId,
				},
				[controllerName],
			),
		);

		return Promise.all([
			loadWithCache(
				currentState,
				getState,
				id,
				controllerName,
				options,
				asFeatureSourceCacheExtra(extraArgument),
			).then(
				function handleLoadResolved(data) {
					dispatch(loadSuccess(controllerName, id, data));
				},
				function handleLoadRejected(err) {
					dispatch(loadFailure(controllerName, id, err));
					throw err;
				},
			),
			refreshByTimer(currentState).then(function handleRefreshFulfilled(
				doRefresh = false,
			) {
				if (doRefresh) {
					const sourcesState = getState()[
						controllerName
					] as FeatureSourcesState;
					const sourceState = sourcesState[id];
					if (
						sourceState &&
						sourceState.doRefresh &&
						!sourceState.refreshPaused &&
						sourceState.requestId === nextRequestId
					) {
						dispatch(
							load(controllerName, id, {
								forceRefresh:
									hasFeatureSourceLoadError(sourceState) ||
									getIsDue(sourceState),
							}),
						);
					}
				}
			}),
		]).catch(function handleLoadException(error) {
			console.warn("Feature source load exception: ", error);
		});
	};

	return async(handleLoad);
};

export function setDataOrError(
	controllerName: string,
	id: string,
	{data, error}: {data?: unknown; error?: unknown},
) {
	if (error) {
		return setError(controllerName, id, error);
	}

	return setData(controllerName, id, data);
}

function refreshByTimer(state: FeatureSourceState) {
	if (
		typeof window !== "undefined" &&
		state.doRefresh &&
		state.timer &&
		state.timer > 0
	) {
		return new Promise((resolve) =>
			setTimeout(() => resolve(true), state.timer),
		);
	}

	return Promise.resolve(false);
}

function isFeatureSourceCacheDebugEnabled() {
	return (
		typeof process !== "undefined" &&
		process.env?.MAPSIGHT_FEATURE_SOURCE_CACHE_DEBUG === "1"
	);
}

function isFeatureSourceCache(value: unknown): value is FeatureSourceCache {
	if (!value || typeof value !== "object") {
		return false;
	}
	const cache = value as FeatureSourceCache;
	return (
		typeof cache.get === "function" &&
		typeof cache.put === "function" &&
		typeof cache.delete === "function" &&
		typeof cache.estimateTotalBytes === "function" &&
		typeof cache.evictLRU === "function"
	);
}

function asFeatureSourceCacheExtra(
	extraArgument: unknown,
): FeatureSourceCacheExtra | undefined {
	if (!extraArgument || typeof extraArgument !== "object") {
		return undefined;
	}
	const extra = extraArgument as FeatureSourceCacheExtra;
	if (
		extra.featureSourceCache !== undefined &&
		!isFeatureSourceCache(extra.featureSourceCache)
	) {
		return {...extra, featureSourceCache: undefined};
	}
	return extra;
}

function shouldUseDocumentCache(state: FeatureSourceState): boolean {
	return state.type === "xhr-json" && typeof state.url === "string";
}

function isSharedDocumentCache(extra?: FeatureSourceCacheExtra): boolean {
	if (extra?.sharedCache !== undefined) {
		return extra.sharedCache;
	}
	return typeof window === "undefined";
}

function documentCacheKey(
	state: FeatureSourceState,
	id: string,
	controllerName: string,
	extra?: FeatureSourceCacheExtra,
): string {
	return buildCacheKey({
		controllerName,
		featureSourceId: id,
		url: state.url,
		appVersion: extra?.featureSourceRevision,
	});
}

async function loadFromLoader(
	state: FeatureSourceState,
	getState: () => unknown,
	id: string,
	controllerName: string,
	loaderOptions: object,
): Promise<FeatureSourceData | undefined> {
	return getLoader(state.type).load(
		state,
		{...loaderOptions, controllerName},
		id,
		getState,
	);
}

async function putDocumentCacheEntry(
	extra: FeatureSourceCacheExtra,
	key: string,
	data: FeatureSourceData,
	meta: {
		etag?: string;
		lastModified?: string;
		cacheControl?: string;
		expires?: string;
		age?: string;
		date?: string;
		ageSec?: number;
	},
	generation?: CacheWriteGeneration,
	url?: string,
) {
	const cache = extra.featureSourceCache;
	if (!cache) {
		return;
	}
	await withDocumentCacheWrite(cache, async () => {
		if (
			generation &&
			url &&
			!isCacheWriteGenerationCurrent(cache, url, generation)
		) {
			return;
		}
		try {
			if (
				!shouldPersistDocumentCache({
					cacheControl: meta.cacheControl,
					expires: meta.expires,
					shared: isSharedDocumentCache(extra),
					ttl: extra.featureSourceCacheTtl,
				})
			) {
				await cache.delete(key);
				return;
			}
			await cache.put(key, {
				data,
				fetchedAt: Date.now(),
				ageSec:
					meta.ageSec ??
					correctedInitialAgeSec({
						ageHeader: meta.age,
						dateHeader: meta.date,
					}),
				date: meta.date,
				bytes: estimateFeatureSourceBytes(data),
				etag: meta.etag,
				lastModified: meta.lastModified,
				cacheControl: meta.cacheControl,
				expires: meta.expires,
			});
		} catch {
			// Optional adapter: a failed put/delete must not fail the load.
		}
	});
}

async function revalidateDocumentCache(
	state: FeatureSourceState,
	extra: FeatureSourceCacheExtra,
	key: string,
	entry: FeatureSourceCacheEntry | null,
	forceRefresh: boolean,
): Promise<FeatureSourceData | undefined> {
	const cache = extra.featureSourceCache;
	const url = state.url ?? "";
	const generation = cache
		? captureCacheWriteGeneration(cache, url)
		: undefined;
	const result = await xhrJson.fetchXhrJson(url, {
		ifNoneMatch: forceRefresh ? undefined : entry?.etag,
		ifModifiedSince: forceRefresh ? undefined : entry?.lastModified,
	});

	if (result.notModified && entry) {
		await putDocumentCacheEntry(
			extra,
			key,
			entry.data,
			{
				etag: result.etag ?? entry.etag,
				lastModified: result.lastModified ?? entry.lastModified,
				cacheControl: result.cacheControl ?? entry.cacheControl,
				expires: result.expires ?? entry.expires,
				age: result.age,
				date: result.date ?? entry.date,
				ageSec: result.ageSec,
			},
			generation,
			url,
		);
		return entry.data;
	}

	if (!result.data) {
		return entry?.data;
	}

	await putDocumentCacheEntry(
		extra,
		key,
		result.data,
		result,
		generation,
		url,
	);
	return result.data;
}

async function readDocumentCacheEntry(
	cache: FeatureSourceCache,
	key: string,
): Promise<FeatureSourceCacheEntry | null> {
	try {
		return await cache.get(key);
	} catch {
		return null;
	}
}

async function loadWithCache(
	state: FeatureSourceState,
	getState: () => unknown,
	id: string,
	controllerName: string,
	options: LoadOptions = {},
	extra?: FeatureSourceCacheExtra,
) {
	const {
		forceRefresh = false,
		useCache = USE_CACHE_YES,
		...loaderOptions
	} = options;

	const cache = extra?.featureSourceCache;
	const canUseDocumentCache =
		useCache !== USE_CACHE_NO && cache && shouldUseDocumentCache(state);

	if (canUseDocumentCache && state.url && extra) {
		const key = documentCacheKey(state, id, controllerName, extra);
		const entry = !forceRefresh
			? await readDocumentCacheEntry(cache, key)
			: null;

		if (entry && useCache === USE_CACHE_ONLY) {
			return entry.data;
		}

		if (entry && !forceRefresh) {
			const decision = evaluateFreshness({
				fetchedAt: entry.fetchedAt,
				ageSec: entry.ageSec,
				date: entry.date,
				cacheControl: entry.cacheControl,
				expires: entry.expires,
				shared: isSharedDocumentCache(extra),
				ttl: extra.featureSourceCacheTtl,
			});
			if (isFeatureSourceCacheDebugEnabled()) {
				console.info("[mapsight-feature-source-cache]", decision, key);
			}
			if (decision === "fresh") {
				return entry.data;
			}
			if (decision === "stale-while-revalidate") {
				void singleFlight(cache, key, () =>
					revalidateDocumentCache(state, extra, key, entry, false),
				).catch(() => undefined);
				return entry.data;
			}
			try {
				return await singleFlight(cache, key, () =>
					revalidateDocumentCache(state, extra, key, entry, false),
				);
			} catch (error) {
				if (
					xhrJson.allowsStaleIfErrorForFailure(error) &&
					allowsStaleOnError({
						fetchedAt: entry.fetchedAt,
						ageSec: entry.ageSec,
						date: entry.date,
						cacheControl: entry.cacheControl,
						expires: entry.expires,
						shared: isSharedDocumentCache(extra),
						ttl: extra.featureSourceCacheTtl,
					})
				) {
					return entry.data;
				}
				throw error;
			}
		}

		if (useCache !== USE_CACHE_ONLY) {
			return singleFlight(cache, key, async () => {
				const replay = !forceRefresh
					? await readDocumentCacheEntry(cache, key)
					: null;
				if (replay) {
					return replay.data;
				}
				return revalidateDocumentCache(
					state,
					extra,
					key,
					null,
					forceRefresh,
				);
			});
		}
	}

	const canUseReduxCache = !forceRefresh && state.data;
	if (useCache !== USE_CACHE_NO && canUseReduxCache) {
		return Promise.resolve(state.data);
	}

	if (useCache === USE_CACHE_ONLY) {
		await Promise.resolve();
		throw new Error(ERROR_COLD_CACHE);
	}

	return loadFromLoader(state, getState, id, controllerName, loaderOptions);
}
