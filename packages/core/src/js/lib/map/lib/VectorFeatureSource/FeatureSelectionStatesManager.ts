import type OlFeature from "ol/Feature";

import {getOlFeatureId} from "@/lib/helpers/ol";
import type {EnhancedStore} from "@/types";

import FeatureSelectionConnector from "./FeatureSelectionConnector";

type FeatureSelectionListener = () => void;

type FeatureSelection = string;

export default class FeatureSelectionStatesManager {
	private _store: EnhancedStore | null;
	private _featureSelectionsControllerName: string | null;
	private _connector: FeatureSelectionConnector | null;
	private readonly _changeHandler: () => void;
	private _changeListeners: FeatureSelectionListener[];

	constructor() {
		this._store = null;
		this._featureSelectionsControllerName = null;
		this._connector = null;
		this._changeHandler = this._handleChange.bind(this);
		this._changeListeners = [];
	}

	addChangeListener(listener: FeatureSelectionListener) {
		this._changeListeners.push(listener);
	}

	removeChangeListener(listener: FeatureSelectionListener) {
		this._changeListeners = this._changeListeners.filter(
			(fn) => fn !== listener,
		);
	}

	get(featureId: string) {
		return this._connector && this._connector.get(featureId);
	}

	getPrevious(featureId: string) {
		return this._connector && this._connector.getPrevious(featureId);
	}

	getAllFeaturesWithState(state: string) {
		return this._connector?.getAllFeaturesWithState(state);
	}

	select(state: string, featureId: string) {
		if (this._connector) {
			this._connector.select(state, featureId);
		}
	}

	deselect(state: string, featureId: string) {
		if (this._connector) {
			this._connector.deselect(state, featureId);
		}
	}

	filterFeaturesByActiveSelections(
		features: Array<OlFeature>,
		selections: Array<FeatureSelection>,
	) {
		return features.filter((feature) => {
			const featureId = getOlFeatureId(feature);
			if (featureId === undefined) {
				return false;
			}

			const selection = this.get(featureId);
			if (selection === null || selection === undefined) {
				return false;
			}

			return selections.indexOf(selection) > -1;
		});
	}

	filterChangedFeatures(features: Array<OlFeature>) {
		return features.filter((feature) => {
			const featureId = getOlFeatureId(feature);
			return featureId === undefined ? false : this._isChanged(featureId);
		});
	}

	setFeatureSelectionsControllerName(
		featureSelectionsControllerName: string,
	) {
		this._featureSelectionsControllerName = featureSelectionsControllerName;
		this._updateConnector();
	}

	bindToStore(store: EnhancedStore) {
		this._store = store;
		this._updateConnector();
	}

	_isChanged(featureId: string) {
		return this.get(featureId) !== this.getPrevious(featureId);
	}

	_updateConnector() {
		if (this._connector) {
			this._connector.unsubscribe(this._changeHandler);
		}

		const featureSelectionsController =
			this._featureSelectionsControllerName &&
			this._store?.getController(this._featureSelectionsControllerName);
		if (featureSelectionsController) {
			this._connector = FeatureSelectionConnector.getInstance(
				featureSelectionsController,
			);
			this._connector.subscribe(this._changeHandler);
		} else {
			this._connector = null;
		}
	}

	_handleChange() {
		this._changeListeners.forEach((listener) => {
			listener();
		});
	}
}
