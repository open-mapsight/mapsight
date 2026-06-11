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
import type {Action, Feature, State} from "@/types";

function getIdsFromData(data: FeatureSourceData) {
	return data?.features?.map((feature) => feature.id);
}

function mergeSource(
	state: FeatureSourcesState,
	id: string,
	change: Partial<FeatureSourceState>,
) {
	if (isEqual(state[id], change)) {
		return state;
	}

	return {...state, [id]: {...state[id], ...change}};
}

function updateSourceData(
	state: FeatureSourcesState,
	id: string,
	reduceData: (data: FeatureSourceData) => FeatureSourceData,
	lastActionType?: string,
) {
	const source = ensureNonNullable(state[id]);
	const oldData = getSourceData(source);
	const newData = reduceData(oldData);

	return mergeSource(state, id, {
		data: newData,
		ids: getIdsFromData(newData),
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
	if (state) {
		for (const id of Object.keys(state)) {
			if (
				oldState[id] &&
				oldState[id] !== state[id] &&
				state[id]?.type === "xhr-json"
			) {
				return mergeSource(state, id, {data: null});
			}
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

	override reduce(state: FeatureSourcesState = {}, action: Action) {
		switch (action.type) {
			case LOAD_FEATURE_SOURCE:
				return mergeSource(state, action.id, {
					isLoading: true,
					refreshPaused: false,
					requestId: action.requestId,
					dataHistory: undefined,
				});

			case FEATURE_SOURCE_ERROR:
			case LOAD_FEATURE_SOURCE_ERROR:
				return mergeSource(state, action.id, {
					error: action.error,
					isLoading: false,
					dataHistory: undefined,
				});

			case FEATURE_SOURCE_DATA:
			case LOAD_FEATURE_SOURCE_SUCCESS:
				return updateSourceData(
					state,
					action.id,
					() => action.data,
					"DATA_LOADED",
				);

			case PAUSE_FEATURE_SOURCE_REFRESH_UNTIL_NEXT_LOAD:
				return mergeSource(state, action.id, {
					refreshPaused: true,
				});

			case FEATURE_SOURCE_DATA_UNDO:
				return mergeSource(
					state,
					action.id,
					undoChange(ensureNonNullable(state[action.id])),
				);

			case FEATURE_SOURCE_DATA_REDO:
				return mergeSource(
					state,
					action.id,
					redoChange(ensureNonNullable(state[action.id])),
				);

			case FEATURE_SOURCE_DATA_ADD_FEATURE:
				return updateSourceData(
					state,
					action.id,
					(oldData) => ({
						...oldData,
						features: [
							...((oldData && oldData.features) || []),
							action.feature,
						],
					}),
					action.type,
				);

			case FEATURE_SOURCE_DATA_ADD_FEATURES:
				return updateSourceData(
					state,
					action.id,
					(oldData) => ({
						...oldData,
						features: [
							...((oldData && oldData.features) || []),
							...action.features,
						],
					}),
					action.type,
				);

			case FEATURE_SOURCE_DATA_UPDATE_FEATURE:
				return updateSourceData(
					state,
					action.id,
					(oldData) => ({
						...oldData,
						features: !oldData.features
							? emptyFeaturesArray
							: oldData.features.map((oldFeature) =>
									oldFeature.id === action.featureId
										? action.feature
										: oldFeature,
								),
					}),
					"UPDATE_FEATURE",
				);

			case FEATURE_SOURCE_DATA_UPDATE_FEATURE_PROPERTY:
				return updateSourceData(
					state,
					action.id,
					(oldData) => ({
						...oldData,
						features: !oldData.features
							? emptyFeaturesArray
							: oldData.features.map((oldFeature) =>
									oldFeature.id === action.featureId
										? {
												...oldFeature,
												properties: {
													...oldFeature.properties,
													[action.propertyId]:
														action.value,
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
					action.id,
					(oldData) => {
						const features = oldData.features
							? [...oldData.features]
							: [];

						action.features.forEach(function handleUpdatedFeature(
							feature: Feature,
						) {
							const index = features.findIndex(
								(f) => f.id === feature.id,
							);
							if (index > -1) {
								features[index] = feature;
							} else {
								features.push(feature);
							}
						});

						return {
							...oldData,
							features: features,
						};
					},
					action.type,
				);

			case FEATURE_SOURCE_DATA_UPDATE_FEATURE_GEOMETRY:
				return updateSourceData(
					state,
					action.id,
					(oldData) => ({
						...oldData,
						features: !oldData.features
							? emptyFeaturesArray
							: oldData.features.map((oldFeature) =>
									oldFeature.id === action.featureId
										? {
												...oldFeature,
												geometry: action.geometry,
											}
										: oldFeature,
								),
					}),
					action.type,
				);

			case FEATURE_SOURCE_DATA_REMOVE_FEATURE:
				return updateSourceData(
					state,
					action.id,
					(oldData) => ({
						...oldData,
						features: oldData.features
							? oldData.features.filter(
									(f) => f.id !== action.featureId,
								)
							: emptyFeaturesArray,
					}),
					action.type,
				);

			case FEATURE_SOURCE_DATA_REMOVE_FEATURES:
				return updateSourceData(
					state,
					action.id,
					(oldData) => ({
						...oldData,
						features: oldData.features
							? oldData.features.filter(
									(f) => !action.featureIds.includes(f.id),
								)
							: emptyFeaturesArray,
					}),
					action.type,
				);

			case FEATURE_SOURCE_DATA_REMOVE_ALL_FEATURES:
				return updateSourceData(
					state,
					action.id,
					(oldData) => ({
						...oldData,
						features: emptyFeaturesArray,
					}),
					action.type,
				);

			default:
				return reduceUncontrolledFeatureSourceChanges(
					baseReducer(state, action),
					state,
				);
		}
	}
}
