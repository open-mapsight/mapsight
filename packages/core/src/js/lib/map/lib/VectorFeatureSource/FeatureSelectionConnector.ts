import {async} from "@/lib/base/actions";
import {
	deselect,
	select,
	selectExclusively,
} from "@/lib/feature-selections/actions";
import type {FeatureSelectionsController} from "@/lib/feature-selections/controller";
import type {
	FeatureSelectionId,
	FeatureSelectionsState,
} from "@/lib/feature-selections/selectors";
import {getFilteredFeatures} from "@/lib/feature-selections/selectors";
import type {FeatureId} from "@/types";

const featureSelectionsObserverInstances = new WeakMap();

type FeatureSelectionListener = () => void;
export default class FeatureSelectionConnector {
	private readonly _featureSelectionsController: FeatureSelectionsController;
	private _reverseData: Map<FeatureSelectionId, Array<FeatureId>>;
	private _data: Map<FeatureId, FeatureSelectionId>;
	private _previousData: Map<FeatureId, FeatureSelectionId>;
	private _listeners: FeatureSelectionListener[];
	private _unsubscribeFeatureSelections: (() => void) | null = null;

	constructor(featureSelectionsController: FeatureSelectionsController) {
		this._featureSelectionsController = featureSelectionsController;
		this._reverseData = new Map();
		this._data = new Map();
		this._previousData = new Map();

		this._listeners = [];
	}

	static getInstance(
		featureSelectionsController: FeatureSelectionsController,
	): FeatureSelectionConnector {
		if (
			featureSelectionsObserverInstances.has(featureSelectionsController)
		) {
			return featureSelectionsObserverInstances.get(
				featureSelectionsController,
			);
		}

		const instance = new FeatureSelectionConnector(
			featureSelectionsController,
		);
		featureSelectionsObserverInstances.set(
			featureSelectionsController,
			instance,
		);
		return instance;
	}

	select(selectionId: string, featureId: string, exclusive = true) {
		const action = exclusive ? selectExclusively : select;
		this._featureSelectionsController.dispatch(
			async(
				action(
					this._featureSelectionsController.getName(),
					selectionId,
					featureId,
				),
			),
		);
	}

	get(featureId: string) {
		return this._data.get(featureId);
	}

	getPrevious(featureId: string) {
		return this._previousData.get(featureId);
	}

	getAllFeaturesWithState(state: string) {
		return this._reverseData.get(state) || [];
	}

	deselect(selectionId: string, featureId: string) {
		this._featureSelectionsController.dispatch(
			async(
				deselect(
					this._featureSelectionsController.getName(),
					selectionId,
					featureId,
				),
			),
		);
	}

	subscribe(listener: FeatureSelectionListener) {
		this._listeners.push(listener);

		if (this._unsubscribeFeatureSelections === null) {
			this._unsubscribeFeatureSelections =
				this._featureSelectionsController.observeUncontrolled(
					(state) => state as FeatureSelectionsState,
					(selections) => {
						this._updateSelectionMaps(selections);
						this._emit();
					},
				);
			this._updateSelectionMaps(
				this._featureSelectionsController.getState() as FeatureSelectionsState,
			);
		}

		// Apply the current selections when a new layer connects, even if
		// the shared observer was already running for a sibling.
		listener();
		return () => this.unsubscribe(listener);
	}

	private _updateSelectionMaps(
		selections: FeatureSelectionsState | undefined,
	) {
		const previous = this._previousData;
		this._previousData = this._data;
		this._data = previous;
		this._data.clear();
		this._reverseData.clear();

		for (const [state, selection] of Object.entries(selections ?? {})) {
			for (const featureId of getFilteredFeatures(selection) ?? []) {
				if (this._data.has(featureId)) {
					continue;
				}
				this._data.set(featureId, state);
				this._reverseData.set(
					state,
					this.getAllFeaturesWithState(state).concat([featureId]),
				);
			}
		}
	}

	unsubscribe(listener: FeatureSelectionListener) {
		this._listeners = this._listeners.filter((l) => l !== listener);

		if (
			this._listeners.length === 0 &&
			this._unsubscribeFeatureSelections
		) {
			this._unsubscribeFeatureSelections();
			this._unsubscribeFeatureSelections = null;
		}
	}

	_emit() {
		this._listeners.forEach((listener) => listener());
	}
}
