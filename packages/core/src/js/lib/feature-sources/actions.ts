import {async, controlled, withPath} from "@/lib/base/actions";
import * as combined from "@/lib/feature-sources/loaders/combined-loader";
import * as local from "@/lib/feature-sources/loaders/local-state-loader";
import type {LocalStateLoaderOptions} from "@/lib/feature-sources/loaders/local-state-loader";
import * as noop from "@/lib/feature-sources/loaders/noop-loader";
import * as xhrJson from "@/lib/feature-sources/loaders/xhr-json-loader";
import {ERROR_COLD_CACHE, getIsDue} from "@/lib/feature-sources/selectors";
import type {
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
		| typeof USE_CACHE_YES
		| typeof USE_CACHE_NO
		| typeof USE_CACHE_ONLY;
};

export type LoadOptions =
	| SharedLoadOptions
	| (LocalStateLoaderOptions & SharedLoadOptions);

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
	const handleLoad: ThunkAction = (dispatch, getState) => {
		const state = getState()[controllerName] as FeatureSourcesState;
		const currentState = state[id] || ({} as FeatureSourceState);
		const {requestId = 0, isLoading, error} = currentState || {};
		if (isLoading && !options?.forceRefresh) {
			return Promise.resolve(); // already loading
		}

		// Failed loads must not be retried immediately. Refreshing sources retry
		// via refreshByTimer with forceRefresh; other callers may pass forceRefresh.
		if (error && !options?.forceRefresh) {
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
									!!sourceState.error ||
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

async function loadWithCache(
	state: FeatureSourceState,
	getState: () => unknown,
	id: string,
	controllerName: string,
	options: LoadOptions = {},
) {
	const {
		forceRefresh = false,
		useCache = USE_CACHE_YES,
		...loaderOptions
	} = options;

	const canUseCache = !forceRefresh && state.data;
	if (useCache === USE_CACHE_ONLY && !canUseCache) {
		await Promise.resolve();
		throw new Error(ERROR_COLD_CACHE);
	}

	if (useCache !== USE_CACHE_NO && canUseCache) {
		return Promise.resolve(state.data);
	}

	return getLoader(state.type).load(
		state,
		{...loaderOptions, controllerName},
		id,
		getState,
	);
}
