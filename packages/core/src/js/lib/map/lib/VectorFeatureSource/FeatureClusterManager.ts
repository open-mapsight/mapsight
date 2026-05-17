import type OlFeature from "ol/Feature";
import type Layer from "ol/layer/Layer";
import type VectorSource from "ol/source/Vector";

import clusterFeatures from "@mapsight/lib-ol/feature/cluster";
import type {ExtendedFitOptions} from "@mapsight/lib-ol/map/fitToExtent";
import {DEFAULT_OPTIONS as FIT_DEFAULT_OPTIONS} from "@mapsight/lib-ol/map/fitToFeatures";

import {getOlFeatureId} from "@/lib/helpers/ol";
import type {MapController} from "@/lib/map/controller";

import {getControllerForLayer} from "../tagLayer";
import type FeatureSelectionStatesManager from "./FeatureSelectionStatesManager";
import type FeatureSourceConnector from "./FeatureSourceConnector";
import createCreateClusterIntoSingleFeature from "./createCreateClusterIntoSingleFeature";
import createCreateClusterIntoSpreadRadiusFeature from "./createCreateClusterIntoSpreadRadiusFeature";
import defaultClusterFeaturePropertiesFunction from "./defaultClusterFeaturePropertiesFunction";

const SPREAD_CLOSE_TO_MINIMUM_THRESHOLD = 1.5;

type GetFeatureInExtentArgs = Parameters<
	InstanceType<typeof VectorSource>["getFeaturesInExtent"]
>;

type GetFeatureInExtent = (...args: GetFeatureInExtentArgs) => OlFeature[];

type ClusterData = {
	features: Array<OlFeature>;
	clusterFeature?: OlFeature;
};

export type ClusterOptions = {
	distance: number;
	spread: boolean;
	spreadDistance: number;
	spreadRadius: number;
	spreadFeaturesIfCloseToMinResolution: boolean;
	fitInViewSelections: string[];
	fitInViewOptions: ExtendedFitOptions;
	properties?: Record<string, unknown>;
};

export type FeatureClusterPropertiesFunction = (
	properties: Record<string, unknown>,
	options: ClusterOptions,
) => Record<string, unknown>;

export type FeatureClusterCache = Map<string, ClusterData>;

export default class FeatureClusterManager {
	private _featureSourceConnector: FeatureSourceConnector;
	private _featureSelectionStatesManager: FeatureSelectionStatesManager;
	private readonly _options: ClusterOptions;
	private readonly _clusterCache: FeatureClusterCache = new Map();
	private _resolution: number | null = null;
	private _active = false;
	private _needsRefresh = true;
	private _layer: Layer | null = null;
	private _mapController: MapController | null = null;

	constructor(
		featureSourceConnector: FeatureSourceConnector,
		featureSelectionStatesManager: FeatureSelectionStatesManager,
	) {
		this._featureSourceConnector = featureSourceConnector;
		this._featureSelectionStatesManager = featureSelectionStatesManager;

		this._options = {
			distance: 20, // TODO: Magic number
			spread: false,
			spreadDistance: 10, // TODO: Magic number
			spreadRadius: 25, // TODO: Magic number
			spreadFeaturesIfCloseToMinResolution: true, // TODO: keep default?
			fitInViewSelections: ["select"], // TODO: keep default?
			fitInViewOptions: {
				...FIT_DEFAULT_OPTIONS,
				maxZoom: 9999,
				nearest: false,
				skipIfInView: false,
			},
		};

		this._featureSelectionStatesManager.addChangeListener(() => {
			this._clusterCache.forEach((cluster, clusterId) => {
				this._handleSelectionChangeCluster(clusterId, cluster);
			});
		});
	}

	_handleSelectionChangeCluster(clusterId: string, cluster: ClusterData) {
		const {fitInViewSelections, fitInViewOptions} = this._options;

		let doFitClusterFeaturesInView = false;

		cluster.features.forEach((feature) => {
			const featureId = getOlFeatureId(feature);
			if (!featureId) {
				return;
			}

			const state = this._featureSelectionStatesManager.get(featureId);
			const previousState =
				this._featureSelectionStatesManager.getPrevious(featureId);
			if (
				state &&
				state !== previousState &&
				fitInViewSelections &&
				fitInViewSelections.indexOf(state) > -1
			) {
				this._needsRefresh = true;
				doFitClusterFeaturesInView = true;
			}
		});

		// zoom to features when selecting the cluster (e.g. through a direct click on the feature in the map)
		if (fitInViewSelections) {
			const clusterState =
				this._featureSelectionStatesManager.get(clusterId);
			const previousClusterState =
				this._featureSelectionStatesManager.getPrevious(clusterId);
			if (
				clusterState &&
				clusterState !== previousClusterState &&
				fitInViewSelections.indexOf(clusterState) > -1
			) {
				doFitClusterFeaturesInView = true;

				// immediately deselect the cluster feature
				this._featureSelectionStatesManager.deselect(
					clusterState,
					clusterId,
				);
			}
		}

		if (doFitClusterFeaturesInView) {
			this._mapController?.fitMapViewToFeatures(
				cluster.features,
				fitInViewOptions,
			);
		}
	}

	setOptions(options: Partial<ClusterOptions>) {
		Object.assign(this._options, options);
	}

	setActive(active: boolean) {
		this._active = active;
	}

	setResolution(resolution: number) {
		if (resolution !== this._resolution) {
			this._resolution = resolution;
			this._needsRefresh = true;
		}
	}

	setLayer(layer: Layer) {
		this._layer = layer;
		this._mapController = getControllerForLayer(layer) ?? null;
	}

	needsRefresh() {
		return this._active && this._needsRefresh;
	}

	isActive() {
		return this._active;
	}

	/**
	 * Get clustered features from features for the given resolution and layer.
	 *
	 * @param features features
	 * @param getFeaturesInExtent get features in extent
	 * @returns clustered features
	 */
	applyClusteringToFeatures(
		features: Array<OlFeature>,
		getFeaturesInExtent: GetFeatureInExtent,
	): Array<OlFeature> {
		this._needsRefresh = false;

		if (!this._active) {
			return features;
		}

		// Check if we should spread because the resolution is close to minimum
		let spread = this._options.spread;
		if (
			!spread &&
			this._options.spreadFeaturesIfCloseToMinResolution &&
			this._resolution
		) {
			const minResolution = Math.max(
				this._layer?.getMinResolution() || 0,
				this._mapController?.getMinResolution() || 0,
			);
			if (minResolution) {
				spread =
					this._resolution / minResolution <
					SPREAD_CLOSE_TO_MINIMUM_THRESHOLD;
			}
		}

		if (spread) {
			return this._getFeaturesSpread(features, getFeaturesInExtent);
		}

		return this._getFeaturesClustered(features, getFeaturesInExtent);
	}

	_getFeaturesSpread(
		features: Array<OlFeature>,
		getFeaturesInExtent: GetFeatureInExtent,
	): Array<OlFeature> {
		if (!this._resolution) {
			return features;
		}

		const createCluster = createCreateClusterIntoSpreadRadiusFeature(
			this._resolution,
			this._options.spreadRadius,
		);

		return clusterFeatures(
			features,
			this._resolution,
			getFeaturesInExtent,
			this._options.spreadDistance || this._options.distance,
			createCluster,
		);
	}

	_getFeaturesClustered(
		unClusteredFeatures: Array<OlFeature>,
		getFeaturesInExtent: GetFeatureInExtent,
	) {
		const clusterPropsFn =
			this._mapController?.getClusterFeaturePropertiesFunction() ||
			defaultClusterFeaturePropertiesFunction;

		const propertiesFunction = (
			properties: Record<string, unknown>,
			options: ClusterOptions,
		) => {
			const state =
				typeof properties.id === "string"
					? this._featureSelectionStatesManager.get(properties.id)
					: undefined;
			const previousState =
				typeof properties.id === "string"
					? this._featureSelectionStatesManager.getPrevious(
							properties.id,
						)
					: undefined;

			return clusterPropsFn(
				{
					...properties,
					// Add state properties
					state,
					previousState,
				},
				options,
			);
		};

		const previousCache = new Map(this._clusterCache);
		this._clusterCache.clear();

		if (!this._resolution) {
			return unClusteredFeatures;
		}

		// actually cluster
		return clusterFeatures(
			unClusteredFeatures,
			this._resolution,
			getFeaturesInExtent,
			this._options.distance,
			createCreateClusterIntoSingleFeature(
				propertiesFunction,
				this._options,
				this._clusterCache,
				previousCache,
			),
		);
	}
}
