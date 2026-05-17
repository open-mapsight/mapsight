import type OlFeature from "ol/Feature";
import type {AnimationOptions} from "ol/View";
import type {Extent} from "ol/extent";
import GeoJSONFormat from "ol/format/GeoJSON";
import type JSONFeature from "ol/format/JSONFeature";
import type Interaction from "ol/interaction/Interaction";
import * as loadingStrategy from "ol/loadingstrategy";
import type {Projection, ProjectionLike} from "ol/proj";
import VectorSource from "ol/source/Vector";

import type {ExtendedFitOptions} from "@mapsight/lib-ol/map/fitToExtent";

import {getOlFeatureId} from "@/lib/helpers/ol";
import type {MapController} from "@/lib/map/controller";
import type DrawInteraction from "@/lib/map/lib/DrawInteraction";
import type {VectorFeatureSourceLayer} from "@/lib/map/types";

import {getControllerForLayer} from "../tagLayer";
import type {ClusterOptions} from "./FeatureClusterManager";
import FeatureClusterManager from "./FeatureClusterManager";
import FeatureSelectionStatesManager from "./FeatureSelectionStatesManager";
import FeatureSourceConnector from "./FeatureSourceConnector";
import MapAnimationManager from "./MapAnimationManager";
import {updateFeaturesInSource} from "./updateFeaturesInSource";

const FALLBACK_INTERNAL_PROJECTION_CODE = "EPSG:3857";

const featureShouldOverlay = (feature: OlFeature) => !!feature.get("state");

/**
 * @classdesc
 * Extended openlayers vector source that is connected to a mapsight feature source
 */
export default class VectorFeatureSource extends VectorSource {
	private readonly _internalProjection: string;
	private readonly _featureSourceConnector: FeatureSourceConnector;
	private readonly _featureSelectionStates: FeatureSelectionStatesManager;
	private readonly _mapAnimator: MapAnimationManager | undefined = undefined;
	private readonly _featureClusterManager: FeatureClusterManager | undefined =
		undefined;
	private _mapController: MapController | null = null;
	private _featureSelections: Array<string> = [];
	private _layer: VectorFeatureSourceLayer | null = null;
	private _active = false;
	private _featureIds: Set<string> = new Set();
	private _externalProjection: ProjectionLike;
	private _drawInteraction: Interaction | null = null;
	private _options: {
		useSelectionOverlay?: boolean;
		canCluster?: boolean;
		canAnimate?: boolean;
	};

	constructor(options = {}) {
		options = {
			canAnimate: true, // TODO: Make dynamic option?
			canCluster: true, // TODO: Make dynamic option?
			useSelectionOverlay: true, // TODO: Make dynamic option?
			...options,
		};

		super({
			strategy: loadingStrategy.all, // TODO: Support other strategies?!
			format: new GeoJSONFormat(), // TODO: Support other formats?!
		});

		this._options = options;

		this.setLoader(this._loader.bind(this));

		const stateChangeHandler = this.refresh.bind(this);

		const format = this.getFormat();
		if (!(format instanceof GeoJSONFormat)) {
			throw new Error("Format must be an instance of GeoJSONFormat");
		}

		// mapsight
		this._internalProjection = FALLBACK_INTERNAL_PROJECTION_CODE;
		this._featureSourceConnector = new FeatureSourceConnector({
			format,
			internalProjection: FALLBACK_INTERNAL_PROJECTION_CODE,
			onUpdate: stateChangeHandler,
		});
		this._featureSelectionStates = new FeatureSelectionStatesManager();
		this._featureSelectionStates.addChangeListener(stateChangeHandler);

		// externalised functionality
		if (this._options.canAnimate) {
			this._mapAnimator = new MapAnimationManager(
				this._featureSourceConnector,
				this._featureSelectionStates,
			);
		}
		if (this._options.canCluster) {
			this._featureClusterManager = new FeatureClusterManager(
				this._featureSourceConnector,
				this._featureSelectionStates,
			);
		}
	}

	_loader(extentToLoad: Extent, resolution: number, projection?: Projection) {
		// TODO: What to do with extent and resolution
		// TODO: Check why projection is sometimes missing (workaround: hard coded fallback to EPSG:3857);
		const nextProjection =
			projection?.getCode() ||
			this._internalProjection ||
			FALLBACK_INTERNAL_PROJECTION_CODE;
		this._featureSourceConnector.setInternalProjection(nextProjection);
		this._featureSourceConnector.load();
	}

	/**
	 * Refreshes this source
	 *
	 * @param {boolean} active active
	 */
	setActive(active = true) {
		this._active = active;
		this.refresh();
	}

	/** @override */
	override loadFeatures(
		extentToLoad: Extent,
		resolution: number,
		projection: Projection,
	) {
		this._active = true;
		super.loadFeatures(extentToLoad, resolution, projection);

		if (this._options.canCluster && this._featureClusterManager) {
			this._featureClusterManager.setResolution(resolution);
			if (this._featureClusterManager.needsRefresh()) {
				this.refresh();
			}
		}
	}

	/** @override */
	override refresh() {
		if (!this._active) {
			return;
		}

		const layer = this._layer;
		const mapController = this._mapController;

		// remove (all) features from overlay
		if (this._options.useSelectionOverlay && mapController && layer) {
			this.getFeatures().forEach((feature) => {
				mapController.removeFeatureFromOverlay(layer, feature);
			});
		}

		// get, filter, cluster and update features
		let features = this._featureSourceConnector.getFeatures();
		features = this._filter(features);

		// check if we got new features before clustering
		//   or cluster features could yield false positives
		const hasAdded = this._checkNewFeatures(features);

		// apply clustering
		features = this._cluster(features);

		// update source (array of features -> internal ol collection)
		updateFeaturesInSource(this, features);

		// apply selection state
		const hasSelectionStateChanged = this._applySelectionStateToFeatures();

		// maybe animate the map
		if (this._mapAnimator) {
			if (hasAdded) {
				this._mapAnimator.handleNewFeatures();
			}
			if (hasSelectionStateChanged) {
				this._mapAnimator.handleFeatureSelectionStateChange();
			}
		}

		// add features to overlay that have a selection state
		if (this._options.useSelectionOverlay && mapController && layer) {
			this.getFeatures()
				.filter(featureShouldOverlay)
				.forEach((feature) => {
					mapController.moveFeatureToOverlay(layer, feature);
				});
		}

		super.changed();
	}

	_checkNewFeatures(nextFeatures: OlFeature[]) {
		let hasAdded = false;
		const oldIds = this._featureIds || new Set<string>();
		const newIds = new Set<string>();

		nextFeatures.forEach(function checkNewFeature(nextFeature) {
			const newId = String(nextFeature.getId());
			if (newId) {
				newIds.add(newId);

				if (!oldIds.has(newId)) {
					hasAdded = true;
				}
			}
		});

		this._featureIds = newIds;

		return hasAdded;
	}

	_cluster(features: OlFeature[]) {
		if (this._options.canCluster && this._featureClusterManager) {
			const getFilteredFeaturesInExtent = (extent: Extent) => {
				const featuresInExtent =
					this._featureSourceConnector.getFeaturesInExtent(extent);
				return this._filter(featuresInExtent);
			};

			features = this._featureClusterManager.applyClusteringToFeatures(
				features,
				getFilteredFeaturesInExtent,
			);
		}

		return features;
	}

	_filter(features: OlFeature[]) {
		// filter by selections
		if (this._featureSelections?.length) {
			features = features.filter((feature) => {
				const id = getOlFeatureId(feature);
				if (id === undefined) {
					return false;
				}

				const selectionState = this._featureSelectionStates.get(id);
				if (selectionState === null || selectionState === undefined) {
					return false;
				}

				return this._featureSelections.includes(selectionState);
			});
		}

		return features;
	}

	_applySelectionStateToFeatures() {
		let hasChanged = false;

		const applySelectionStateToFeature = (feature: OlFeature) => {
			const id = getOlFeatureId(feature);
			if (id === undefined) return;

			const previousSelectionState =
				this._featureSelectionStates.getPrevious(id);
			let selectionState = this._featureSelectionStates.get(id);

			if (
				!selectionState &&
				feature.get("cluster") &&
				feature.get("clusterFeatures") &&
				this._isClusterHighlighted(feature)
			) {
				selectionState = "clusterHighlight";
			}

			feature.set("previousState", previousSelectionState, true);
			feature.set("state", selectionState, true);

			if (selectionState !== previousSelectionState) {
				hasChanged = true;
				feature.changed();
			}
		};
		this.getFeatures().forEach(applySelectionStateToFeature);

		return hasChanged;
	}

	_isClusterHighlighted(cluster: OlFeature) {
		let doHighlight = false;
		const features = cluster.get("clusterFeatures");
		for (const feature of features) {
			const featureId = getOlFeatureId(feature);
			if (featureId === undefined) continue;

			const state = this._featureSelectionStates.get(featureId);
			if (state) {
				doHighlight = true;
				break;
			}
		}

		return doHighlight;
	}

	override addFeature(feature: OlFeature) {
		const format = this.getFormat() as JSONFeature;
		this._featureSourceConnector.addFeature(
			format.writeFeatureObject(feature, {
				dataProjection: this._externalProjection,
				featureProjection: this._internalProjection,
			}),
		);
	}

	override addFeatures(features: OlFeature[]) {
		const format = this.getFormat() as JSONFeature;
		this._featureSourceConnector.addFeatures(
			format.writeFeaturesObject(features, {
				dataProjection: this._externalProjection,
				featureProjection: this._internalProjection,
			}),
		);
	}

	updateFeature(feature: OlFeature, {quiet = false} = {}) {
		const featureId = getOlFeatureId(feature);
		if (featureId === undefined) {
			console.error("Cannot update feature without id");
			return;
		}

		const format = this.getFormat() as JSONFeature;
		this._featureSourceConnector.updateFeature(
			featureId,
			format.writeFeatureObject(feature, {
				dataProjection: this._externalProjection,
				featureProjection: this._internalProjection,
			}),
			{quiet: quiet},
		);
	}

	updateFeatures(features: OlFeature[], {quiet = false} = {}) {
		if (!features || !Array.isArray(features)) {
			console.error(
				"Cannot update features. Expected array, got: ",
				features,
			);
			return;
		}

		const format = this.getFormat() as JSONFeature;
		this._featureSourceConnector.updateFeatures(
			format.writeFeaturesObject(features, {
				dataProjection: this._externalProjection,
				featureProjection: this._internalProjection,
			}).features,
			{quiet: quiet},
		);
	}

	updateFeatureGeometry(feature: OlFeature, {quiet = false} = {}) {
		if (!feature) {
			console.error("Cannot update feature. Missing feature.");
			return;
		}

		const id = getOlFeatureId(feature);
		if (id === null || id === undefined) {
			console.error("Cannot update feature. Missing id");
			return;
		}

		const geom = feature.getGeometry();
		if (!geom) {
			console.error("Cannot update feature. Missing geometry");
			return;
		}

		const format = this.getFormat() as JSONFeature;
		this._featureSourceConnector.updateFeatureGeometry(
			id,
			format.writeGeometryObject(geom, {
				dataProjection: this._externalProjection,
				featureProjection: this._internalProjection,
			}),
			{quiet: quiet},
		);
	}

	updateFeatureGeometries(
		features: OlFeature[],
		options: {quiet?: boolean} = {},
	) {
		features.forEach((feature) =>
			this.updateFeatureGeometry(feature, options),
		);
	}

	override clear() {
		this._featureSourceConnector.clear();
	}

	setProjection(projection: ProjectionLike) {
		this._externalProjection = projection;
		this._featureSourceConnector.setProjection(projection);
	}

	setFeatureSourceId(id: string) {
		this._featureSourceConnector.setId(id);
	}

	setFeatureSourcesControllerName(featureSourcesControllerName: string) {
		this._featureSourceConnector.setControllerName(
			featureSourcesControllerName,
		);
	}

	setFeatureSelectionsControllerName(
		featureSelectionsControllerName: string,
	) {
		this._featureSelectionStates.setFeatureSelectionsControllerName(
			featureSelectionsControllerName,
		);
	}

	setFeatureSelections(featureSelections: string[]) {
		this._featureSelections = featureSelections;
	}

	setLayer(layer: VectorFeatureSourceLayer) {
		this._layer = layer;
		const mapController = getControllerForLayer(layer);
		if (mapController) {
			this.setMapController(mapController);
		}
		if (this._featureClusterManager) {
			this._featureClusterManager.setLayer(layer);
		}
		this.setActive(true);
	}

	setDrawInteraction(drawInteraction: DrawInteraction) {
		this._drawInteraction = drawInteraction;
	}

	setMapController(mapController: MapController) {
		const store = mapController.getStore();
		if (!store) {
			console.error("Cannot set map controller without store");
			return;
		}

		this._mapController = mapController;
		this._featureSourceConnector.setStore(store);
		this._featureSelectionStates.bindToStore(store);
		this._featureSourceConnector.setTargetControllerName(
			mapController.getName(),
		);
		if (this._mapAnimator) {
			this._mapAnimator.setMapController(mapController);
		}
	}

	setKeepFeaturesInViewSelections(selections: string[]) {
		if (this._mapAnimator) {
			this._mapAnimator.setOption(
				"keepFeaturesInViewSelections",
				selections,
			);
		}
	}

	setKeepFeaturesInViewOptions(options: ExtendedFitOptions) {
		if (this._mapAnimator) {
			this._mapAnimator.setOption("keepFeaturesInViewOptions", options);
		}
	}

	setKeepAllFeaturesInView(value: boolean) {
		if (this._mapAnimator) {
			this._mapAnimator.setOption("keepAllFeaturesInView", value);
		}
	}

	setFitFeaturesInViewSelections(selections: string[]) {
		if (this._mapAnimator) {
			this._mapAnimator.setOption(
				"fitFeaturesInViewSelections",
				selections,
			);
		}
	}

	setFitFeaturesInViewOptions(options: ExtendedFitOptions) {
		if (this._mapAnimator) {
			this._mapAnimator.setOption("fitFeaturesInViewOptions", options);
		}
	}

	setFitAllFeaturesInView(value: boolean) {
		if (this._mapAnimator) {
			this._mapAnimator.setOption("fitAllFeaturesInView", value);
		}
	}

	setCenterFeaturesInViewSelections(selections: string[]) {
		if (this._mapAnimator) {
			this._mapAnimator.setOption(
				"centerFeaturesInViewSelections",
				selections,
			);
		}
	}

	setCenterFeaturesInViewOptions(options: AnimationOptions) {
		if (this._mapAnimator) {
			this._mapAnimator.setOption("centerFeaturesInViewOptions", options);
		}
	}

	setCenterAllFeaturesInView(value: boolean) {
		if (this._mapAnimator) {
			this._mapAnimator.setOption("centerAllFeaturesInView", value);
		}
	}

	setClusterFeatures(value: boolean) {
		if (this._featureClusterManager) {
			this._featureClusterManager.setActive(value);
		}
	}

	setClusterFeaturesOptions(options: ClusterOptions) {
		if (this._featureClusterManager) {
			this._featureClusterManager.setOptions(options);
		}
	}
}
