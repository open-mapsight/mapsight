import * as nonNull from "@mapsight/lib-js/nonNullable";
import type {ExtendedFitOptions} from "@mapsight/lib-ol/map/fitToExtent";
import {DEFAULT_OPTIONS as FIT_DEFAULT_OPTIONS} from "@mapsight/lib-ol/map/fitToFeatures";
import type {CenterOnFeatureOptions} from "@mapsight/lib-ol/view/centerOnFeature";
import {DEFAULT_OPTIONS as CENTER_DEFAULT_OPTIONS} from "@mapsight/lib-ol/view/centerOnFeature";
import {observeState} from "@mapsight/lib-redux/observe-state";

import type {MapController} from "@/lib/map/controller";
import {ANIMATE_ONCE} from "@/lib/map/controller";
import type FeatureSelectionStatesManager from "@/lib/map/lib/VectorFeatureSource/FeatureSelectionStatesManager";
import type FeatureSourceConnector from "@/lib/map/lib/VectorFeatureSource/FeatureSourceConnector";
import {mapSizeSelector} from "@/lib/map/selectors";
import type {FeatureId} from "@/types";

export type MapAnimationOptions = {
	// center = when adding new features, center the view to fit features
	centerAllFeaturesInView: boolean | "once";
	centerFeaturesInViewSelections: string[];
	centerFeaturesInViewOptions: CenterOnFeatureOptions;

	// fit = when adding new features, fit view to features
	fitAllFeaturesInView: boolean | "once";
	fitFeaturesInViewSelections: string[];
	fitFeaturesInViewOptions: ExtendedFitOptions;

	// keep = on map size change, fit view to features
	keepAllFeaturesInView: boolean;
	keepFeaturesInViewSelections: string[];
	keepFeaturesInViewOptions: ExtendedFitOptions;
};

export default class MapAnimationManager {
	private _featureSourceConnector: FeatureSourceConnector;
	private _featureSelectionStatesManager: FeatureSelectionStatesManager;
	private readonly _options: MapAnimationOptions;
	private _isFitted = false;
	private _isCentered = false;
	private _mapController: MapController | null = null;
	private _unsubscribeMapSize: (() => void) | null = null;

	constructor(
		featureSourceConnector: FeatureSourceConnector,
		featureSelectionStatesManager: FeatureSelectionStatesManager,
	) {
		this._featureSourceConnector = featureSourceConnector;
		this._featureSelectionStatesManager = featureSelectionStatesManager;

		this._options = {
			centerAllFeaturesInView: false,
			centerFeaturesInViewSelections: [],
			centerFeaturesInViewOptions: CENTER_DEFAULT_OPTIONS,

			fitAllFeaturesInView: false, // true|false|"once"
			fitFeaturesInViewSelections: ["select"], // TODO: keep default?
			fitFeaturesInViewOptions: FIT_DEFAULT_OPTIONS,

			keepAllFeaturesInView: false,
			keepFeaturesInViewOptions: {...FIT_DEFAULT_OPTIONS, keepZoom: true},
			keepFeaturesInViewSelections: ["select"], // TODO: keep default?
		};
	}

	setOptions(options: Partial<MapAnimationOptions>) {
		Object.assign(this._options, options);
	}

	setOption<TKey extends keyof MapAnimationOptions>(
		key: TKey,
		value: MapAnimationOptions[TKey],
	) {
		this._options[key] = value;
	}

	setMapController(mapController: MapController) {
		if (this._unsubscribeMapSize) {
			this._unsubscribeMapSize();
			this._unsubscribeMapSize = null;
		}

		this._mapController = mapController;

		// listen to map size changes of displaying layer
		// TODO: Does not belong here. Belong to the layer/map controller!
		this._unsubscribeMapSize = observeState(
			mapController,
			mapSizeSelector,
			this.handleMapSizeChange.bind(this),
		);
	}

	handleMapSizeChange() {
		const {keepAllFeaturesInView} = this._options;
		if (keepAllFeaturesInView) {
			this._mapController?.fitMapViewToFeatures(
				this._featureSourceConnector.getFeatures(),
				this._options.keepFeaturesInViewOptions,
			);
			return;
		}

		const {keepFeaturesInViewSelections} = this._options;
		if (keepFeaturesInViewSelections) {
			const ids = keepFeaturesInViewSelections
				.flatMap((selection) =>
					this._featureSelectionStatesManager.getAllFeaturesWithState(
						selection,
					),
				)
				.filter(nonNull.is);

			const features = ids
				.map((featureId) => this._getFeatureById(featureId))
				.filter(nonNull.is);
			if (features.length) {
				this._mapController?.fitMapViewToFeatures(
					features,
					this._options.keepFeaturesInViewOptions,
				);
			}
		}
	}

	handleFeatureSelectionStateChange() {
		const {fitAllFeaturesInView, centerAllFeaturesInView} = this._options;
		if (fitAllFeaturesInView || centerAllFeaturesInView) {
			return;
		}

		this._handleFitAndCenterSelectedFeaturesInView();
	}

	handleNewFeatures() {
		const {fitAllFeaturesInView, centerAllFeaturesInView} = this._options;
		if (fitAllFeaturesInView) {
			this._handleFitAll();
		} else if (centerAllFeaturesInView) {
			this._handleCenterAll();
		} else {
			this._handleFitAndCenterSelectedFeaturesInView();
		}
	}

	_handleCenterAll() {
		const {centerFeaturesInViewOptions, centerAllFeaturesInView} =
			this._options;
		if (centerAllFeaturesInView !== ANIMATE_ONCE || !this._isCentered) {
			this._isCentered = true;
			this._mapController?.centerViewOnFeatures(
				this._featureSourceConnector.getFeatures(),
				centerFeaturesInViewOptions,
			);
		}
	}

	_handleFitAll() {
		const {fitAllFeaturesInView, fitFeaturesInViewOptions} = this._options;
		if (fitAllFeaturesInView !== ANIMATE_ONCE || !this._isFitted) {
			this._isFitted = true;
			this._mapController?.fitMapViewToFeatures(
				this._featureSourceConnector.getFeatures(),
				fitFeaturesInViewOptions,
			);
		}
	}

	_handleFitAndCenterSelectedFeaturesInView() {
		const {fitFeaturesInViewSelections, centerFeaturesInViewSelections} =
			this._options;
		if (fitFeaturesInViewSelections || centerFeaturesInViewSelections) {
			const changedFeatures =
				this._featureSelectionStatesManager.filterChangedFeatures(
					this._featureSourceConnector.getFeatures(),
				);

			if (fitFeaturesInViewSelections) {
				const features =
					this._featureSelectionStatesManager.filterFeaturesByActiveSelections(
						changedFeatures,
						fitFeaturesInViewSelections,
					);
				if (features.length) {
					this._mapController?.fitMapViewToFeatures(
						features,
						this._options.fitFeaturesInViewOptions,
					);
					return;
				}
			}

			if (centerFeaturesInViewSelections) {
				const features =
					this._featureSelectionStatesManager.filterFeaturesByActiveSelections(
						changedFeatures,
						centerFeaturesInViewSelections,
					);
				if (features.length) {
					this._mapController?.centerViewOnFeatures(
						features,
						this._options.centerFeaturesInViewOptions,
					);
				}
			}
		}
	}

	_getFeatureById(featureId: FeatureId) {
		if (featureId !== undefined) {
			return this._featureSourceConnector
				.getFeatures()
				.find((feature) => feature.getId() === featureId);
		}
	}
}
