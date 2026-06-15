import isEqual from "lodash/isEqual";

import {ensureNonNullable} from "@mapsight/lib-js/nonNullable";
import {
	getAndObserveState,
	observeState,
} from "@mapsight/lib-redux/observe-state";

import {async} from "@/lib/base/actions";
import {BaseController} from "@/lib/base/controller";
import {baseReducer} from "@/lib/base/reducer";
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
	PAUSE_FEATURE_SOURCE_REFRESH_UNTIL_NEXT_LOAD,
	setDataOrError,
} from "@/lib/feature-sources/actions";
import {
	createCombinedFeatureSourceSelector,
	getCombinedFeatureSourceBindings,
} from "@/lib/feature-sources/lib/combined";
import {
	nextDataHistory,
	redoChange,
	undoChange,
} from "@/lib/feature-sources/lib/history";
import {getSourceData} from "@/lib/feature-sources/selectors";
import type {
	FeatureSourceData,
	FeatureSourceState,
	FeatureSourcesState,
} from "@/lib/feature-sources/types";
import type {Action, Feature, FeatureId, Geometry, State} from "@/types";

type FeatureSourceActionWithId<TType extends string> = Action & {
	type: TType;
	id: string;
};

type FeatureSourcesControllerAction =
	| (FeatureSourceActionWithId<typeof LOAD_FEATURE_SOURCE> & {
			requestId: number;
	  })
	| (FeatureSourceActionWithId<
			typeof FEATURE_SOURCE_ERROR | typeof LOAD_FEATURE_SOURCE_ERROR
	  > & {
			error: FeatureSourceState["error"];
	  })
	| (FeatureSourceActionWithId<
			typeof FEATURE_SOURCE_DATA | typeof LOAD_FEATURE_SOURCE_SUCCESS
	  > & {
			data: FeatureSourceData;
	  })
	| FeatureSourceActionWithId<
			| typeof PAUSE_FEATURE_SOURCE_REFRESH_UNTIL_NEXT_LOAD
			| typeof FEATURE_SOURCE_DATA_UNDO
			| typeof FEATURE_SOURCE_DATA_REDO
			| typeof FEATURE_SOURCE_DATA_REMOVE_ALL_FEATURES
	  >
	| (FeatureSourceActionWithId<typeof FEATURE_SOURCE_DATA_ADD_FEATURE> & {
			feature: Feature;
	  })
	| (FeatureSourceActionWithId<typeof FEATURE_SOURCE_DATA_ADD_FEATURES> & {
			features: Feature[];
	  })
	| (FeatureSourceActionWithId<typeof FEATURE_SOURCE_DATA_UPDATE_FEATURE> & {
			featureId: FeatureId;
			feature: Feature;
	  })
	| (FeatureSourceActionWithId<
			typeof FEATURE_SOURCE_DATA_UPDATE_FEATURE_PROPERTY
	  > & {
			featureId: FeatureId;
			propertyId: string;
			value: unknown;
	  })
	| (FeatureSourceActionWithId<typeof FEATURE_SOURCE_DATA_UPDATE_FEATURES> & {
			features: Feature[];
	  })
	| (FeatureSourceActionWithId<
			typeof FEATURE_SOURCE_DATA_UPDATE_FEATURE_GEOMETRY
	  > & {
			featureId: FeatureId;
			geometry: Geometry;
	  })
	| (FeatureSourceActionWithId<typeof FEATURE_SOURCE_DATA_REMOVE_FEATURE> & {
			featureId: FeatureId;
	  })
	| (FeatureSourceActionWithId<typeof FEATURE_SOURCE_DATA_REMOVE_FEATURES> & {
			featureIds: FeatureId[];
	  });

function getIdsFromData(data: FeatureSourceState["data"]) {
	return data?.features?.map((feature) => feature.id);
}

function getFeaturesByIdFromData(data: FeatureSourceState["data"]) {
	const featuresById: Record<FeatureId, Feature> = {};
	for (const feature of data?.features ?? []) {
		featuresById[feature.id] ??= feature;
	}
	return Object.keys(featuresById).length ? featuresById : undefined;
}

function normalizeFeatureSourceData(
	data: FeatureSourceState["data"],
): FeatureSourceState["data"] {
	if (!data?.features || data.type === "FeatureCollection") {
		return data;
	}

	return {
		...data,
		type: "FeatureCollection",
	};
}

function mergeSource(
	state: FeatureSourcesState,
	id: string,
	change: Partial<FeatureSourceState>,
): FeatureSourcesState {
	if (isEqual(state[id], change)) {
		return state;
	}

	return {
		...state,
		[id]: {...state[id], ...change} as FeatureSourceState,
	};
}

function normalizeFeatureSourceState(
	source: FeatureSourceState,
): FeatureSourceState {
	const data =
		source.data === undefined
			? null
			: normalizeFeatureSourceData(source.data);

	return {
		...source,
		data,
		ids: getIdsFromData(data),
		featuresById: getFeaturesByIdFromData(data),
		lastUpdate: source.lastUpdate === undefined ? null : source.lastUpdate,
		lastActionType:
			source.lastActionType === undefined ? null : source.lastActionType,
	};
}

function shouldNormalizeFeatureSourceState(source: FeatureSourceState) {
	const data =
		source.data === undefined
			? null
			: normalizeFeatureSourceData(source.data);

	return (
		source.data === undefined ||
		source.data !== data ||
		!isEqual(source.ids, getIdsFromData(data)) ||
		!isEqual(source.featuresById, getFeaturesByIdFromData(data)) ||
		source.lastUpdate === undefined ||
		source.lastActionType === undefined
	);
}

function normalizeFeatureSourcesState(
	state: FeatureSourcesState,
): FeatureSourcesState {
	let hasMissingRuntimeFields = false;
	for (const source of Object.values(state)) {
		if (shouldNormalizeFeatureSourceState(source)) {
			hasMissingRuntimeFields = true;
			break;
		}
	}

	if (!hasMissingRuntimeFields) {
		return state;
	}

	return Object.fromEntries(
		Object.entries(state).map(([id, source]) => [
			id,
			normalizeFeatureSourceState(source),
		]),
	);
}

function shouldClearXhrDataAfterConfigChange(
	oldSource: FeatureSourceState,
	nextSource: FeatureSourceState,
) {
	return (
		oldSource.type !== nextSource.type ||
		(nextSource.type === "xhr-json" && oldSource.url !== nextSource.url)
	);
}

function updateSourceData(
	state: FeatureSourcesState,
	id: string,
	reduceData: (data: FeatureSourceData) => FeatureSourceData,
	lastActionType?: string,
) {
	const source = ensureNonNullable(state[id]);
	const oldData = getSourceData(source);
	const newData = normalizeFeatureSourceData(reduceData(oldData));

	return mergeSource(state, id, {
		data: newData,
		ids: getIdsFromData(newData),
		featuresById: getFeaturesByIdFromData(newData),
		error: undefined,
		isLoading: false,
		lastUpdate: +new Date(),
		lastActionType: lastActionType,
		dataHistory: source.enableHistory ? nextDataHistory(source) : undefined,
	});
}

function reduceUncontrolledFeatureSourceChanges(
	state: FeatureSourcesState,
	oldState: FeatureSourcesState = {},
) {
	for (const [id, source] of Object.entries(state)) {
		const oldSource = oldState[id];
		if (
			oldSource &&
			oldSource !== source &&
			shouldClearXhrDataAfterConfigChange(oldSource, source)
		) {
			return mergeSource(state, id, {data: null});
		}
	}

	return state;
}

const emptyFeaturesArray: Array<Feature> = [];

type CombinedFeatureSourceBinding = {
	featureSourceNames: string[];
	unsubscribe: () => void;
};

export class FeatureSourcesController extends BaseController {
	#combinedFeatureSourceBindings = new Map<
		string,
		CombinedFeatureSourceBinding
	>();

	override init() {
		const store = this.getStore();
		if (!store) {
			return;
		}

		this.syncCombinedFeatureSourceBindings();

		const controllerName = this.getName();
		observeState(
			store,
			(state) =>
				getCombinedFeatureSourceBindings(
					state[controllerName] as FeatureSourcesState,
				),
			() => this.syncCombinedFeatureSourceBindings(),
			isEqual,
		);
	}

	syncCombinedFeatureSourceBindings() {
		const sources = this.getState() as FeatureSourcesState;
		const activeIds = new Set<string>();

		for (const [id, source] of Object.entries(sources)) {
			if (source.type !== "combined") {
				continue;
			}

			const featureSourceNames = source.featureSourceNames ?? [];
			activeIds.add(id);
			const existing = this.#combinedFeatureSourceBindings.get(id);
			if (
				existing &&
				isEqual(existing.featureSourceNames, featureSourceNames)
			) {
				continue;
			}

			existing?.unsubscribe();
			this.#combinedFeatureSourceBindings.set(id, {
				featureSourceNames,
				unsubscribe: this.bindCombinedFeatureSource(id, source),
			});
		}

		for (const [id, binding] of this.#combinedFeatureSourceBindings) {
			if (!activeIds.has(id)) {
				binding.unsubscribe();
				this.#combinedFeatureSourceBindings.delete(id);
			}
		}
	}

	bindCombinedFeatureSource(
		featureSourceId: string,
		source: FeatureSourceState,
	) {
		const controllerName = this.getName();
		const store = this.getStore();
		if (!store) {
			console.error(
				"Can't bind combined feature source: store is not set",
			);
			return () => undefined;
		}

		const selector = createCombinedFeatureSourceSelector(
			source.featureSourceNames ?? [],
			controllerName,
		);

		return getAndObserveState(
			store,
			selector,
			({data, error}) => {
				this.dispatch(
					async(
						setDataOrError(controllerName, featureSourceId, {
							data,
							error,
						}),
					),
				);
			},
			isEqual,
		);
	}

	bindFeatureSourceToStore(
		featureSourceId: string,
		selector: (state: State) => FeatureSourceState,
	) {
		const controllerName = this.getName();
		const store = this.getStore();
		if (!store) {
			console.error(
				"Can't bind feature source to store: store is not set",
			);
			return;
		}

		observeState(store, selector, ({data, error}) => {
			this.dispatch(
				async(
					setDataOrError(controllerName, featureSourceId, {
						data,
						error,
					}),
				),
			);
		});
	}

	override reduce(
		state: FeatureSourcesState = {},
		action: Action,
	): FeatureSourcesState {
		const featureSourceAction = action as FeatureSourcesControllerAction;

		switch (featureSourceAction.type) {
			case LOAD_FEATURE_SOURCE:
				return mergeSource(state, featureSourceAction.id, {
					isLoading: true,
					refreshPaused: false,
					requestId: featureSourceAction.requestId,
					dataHistory: undefined,
				});

			case FEATURE_SOURCE_ERROR:
			case LOAD_FEATURE_SOURCE_ERROR:
				return mergeSource(state, featureSourceAction.id, {
					error: featureSourceAction.error,
					isLoading: false,
					dataHistory: undefined,
				});

			case FEATURE_SOURCE_DATA:
			case LOAD_FEATURE_SOURCE_SUCCESS:
				return updateSourceData(
					state,
					featureSourceAction.id,
					() => featureSourceAction.data,
					"DATA_LOADED",
				);

			case PAUSE_FEATURE_SOURCE_REFRESH_UNTIL_NEXT_LOAD:
				return mergeSource(state, featureSourceAction.id, {
					refreshPaused: true,
				});

			case FEATURE_SOURCE_DATA_UNDO:
				return mergeSource(
					state,
					featureSourceAction.id,
					undoChange(
						ensureNonNullable(state[featureSourceAction.id]),
					),
				);

			case FEATURE_SOURCE_DATA_REDO:
				return mergeSource(
					state,
					featureSourceAction.id,
					redoChange(
						ensureNonNullable(state[featureSourceAction.id]),
					),
				);

			case FEATURE_SOURCE_DATA_ADD_FEATURE:
				return updateSourceData(
					state,
					featureSourceAction.id,
					(oldData) => ({
						...oldData,
						features: [
							...((oldData && oldData.features) || []),
							featureSourceAction.feature,
						],
					}),
					featureSourceAction.type,
				);

			case FEATURE_SOURCE_DATA_ADD_FEATURES:
				return updateSourceData(
					state,
					featureSourceAction.id,
					(oldData) => ({
						...oldData,
						features: [
							...((oldData && oldData.features) || []),
							...featureSourceAction.features,
						],
					}),
					featureSourceAction.type,
				);

			case FEATURE_SOURCE_DATA_UPDATE_FEATURE:
				return updateSourceData(
					state,
					featureSourceAction.id,
					(oldData) => ({
						...oldData,
						features: !oldData.features
							? emptyFeaturesArray
							: oldData.features.map((oldFeature) =>
									oldFeature.id ===
									featureSourceAction.featureId
										? featureSourceAction.feature
										: oldFeature,
								),
					}),
					"UPDATE_FEATURE",
				);

			case FEATURE_SOURCE_DATA_UPDATE_FEATURE_PROPERTY:
				return updateSourceData(
					state,
					featureSourceAction.id,
					(oldData) => ({
						...oldData,
						features: !oldData.features
							? emptyFeaturesArray
							: oldData.features.map((oldFeature) =>
									oldFeature.id ===
									featureSourceAction.featureId
										? {
												...oldFeature,
												properties: {
													...oldFeature.properties,
													[featureSourceAction.propertyId]:
														featureSourceAction.value,
												},
											}
										: oldFeature,
								),
					}),
					"UPDATE_FEATURE_PROPERTY",
				);

			case FEATURE_SOURCE_DATA_UPDATE_FEATURES:
				return updateSourceData(
					state,
					featureSourceAction.id,
					(oldData) => {
						const features = oldData.features
							? [...oldData.features]
							: [];

						featureSourceAction.features.forEach(
							function handleUpdatedFeature(feature: Feature) {
								const index = features.findIndex(
									(f) => f.id === feature.id,
								);
								if (index > -1) {
									features[index] = feature;
								} else {
									features.push(feature);
								}
							},
						);

						return {
							...oldData,
							features: features,
						};
					},
					featureSourceAction.type,
				);

			case FEATURE_SOURCE_DATA_UPDATE_FEATURE_GEOMETRY:
				return updateSourceData(
					state,
					featureSourceAction.id,
					(oldData) => ({
						...oldData,
						features: !oldData.features
							? emptyFeaturesArray
							: oldData.features.map((oldFeature) =>
									oldFeature.id ===
									featureSourceAction.featureId
										? {
												...oldFeature,
												geometry:
													featureSourceAction.geometry,
											}
										: oldFeature,
								),
					}),
					featureSourceAction.type,
				);

			case FEATURE_SOURCE_DATA_REMOVE_FEATURE:
				return updateSourceData(
					state,
					featureSourceAction.id,
					(oldData) => ({
						...oldData,
						features: oldData.features
							? oldData.features.filter(
									(f) =>
										f.id !== featureSourceAction.featureId,
								)
							: emptyFeaturesArray,
					}),
					featureSourceAction.type,
				);

			case FEATURE_SOURCE_DATA_REMOVE_FEATURES:
				return updateSourceData(
					state,
					featureSourceAction.id,
					(oldData) => ({
						...oldData,
						features: oldData.features
							? oldData.features.filter(
									(f) =>
										!featureSourceAction.featureIds.includes(
											f.id,
										),
								)
							: emptyFeaturesArray,
					}),
					featureSourceAction.type,
				);

			case FEATURE_SOURCE_DATA_REMOVE_ALL_FEATURES:
				return updateSourceData(
					state,
					featureSourceAction.id,
					(oldData) => ({
						...oldData,
						features: emptyFeaturesArray,
					}),
					featureSourceAction.type,
				);

			default:
				return reduceUncontrolledFeatureSourceChanges(
					normalizeFeatureSourcesState(baseReducer(state, action)),
					state,
				);
		}
	}
}
