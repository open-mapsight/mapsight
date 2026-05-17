import type GeoJSONFormat from "ol/format/GeoJSON";
import type {ProjectionLike} from "ol/proj";
import type VectorSource from "ol/source/Vector";

import {async, quiet as quietAction} from "@/lib/base/actions";
import {
	addFeature,
	addFeatures,
	load,
	removeAllFeatures,
	removeFeature,
	updateFeature,
	updateFeatureGeometry,
	updateFeatures,
} from "@/lib/feature-sources/actions";
import type {ActionOrThunk, EnhancedStore, Feature, Geometry} from "@/types";

import SharedReadonlyVectorFeatureSource from "./SharedReadonlyVectorFeatureSource";

export default class FeatureSourceConnector {
	private _id: string | null = null;
	private _targetControllerName: string | undefined = undefined;
	private _unsubscribeFeatureSource: (() => void) | null = null;
	private _store: EnhancedStore | null = null;
	private _internalProjection: ProjectionLike;
	private _externalProjection: ProjectionLike | undefined;
	private readonly _onUpdate: () => void;
	private _controllerName: string | undefined = undefined;
	private readonly _format: GeoJSONFormat;
	private _source: SharedReadonlyVectorFeatureSource | null = null;

	constructor({
		onUpdate,
		format,
		internalProjection,
		externalProjection,
	}: {
		onUpdate: () => void;
		format: GeoJSONFormat;
		internalProjection: ProjectionLike;
		externalProjection?: ProjectionLike;
	}) {
		this._internalProjection = internalProjection;
		this._externalProjection = externalProjection;
		this._format = format;
		this._onUpdate = onUpdate;
	}

	_dispatchIfPossible(action: ActionOrThunk) {
		if (this._controllerName && this._id && this._store) {
			this._store.dispatch(action);
		}
	}

	load() {
		if (this._controllerName && this._id)
			this._dispatchIfPossible(load(this._controllerName, this._id));
	}

	getFeatures() {
		return this._source ? this._source.getFeatures() : [];
	}

	getFeaturesInExtent(
		...args: Parameters<
			InstanceType<typeof VectorSource>["getFeaturesInExtent"]
		>
	) {
		return this._source ? this._source.getFeaturesInExtent(...args) : [];
	}

	addFeature(feature: Feature) {
		if (this._controllerName && this._id)
			this._dispatchIfPossible(
				async(addFeature(this._controllerName, this._id, feature)),
			);
	}

	addFeatures(features: Feature[]) {
		if (this._controllerName && this._id)
			this._dispatchIfPossible(
				async(addFeatures(this._controllerName, this._id, features)),
			);
	}

	updateFeature(featureId: string, feature: Feature, {quiet = false} = {}) {
		if (!this._controllerName || !this._id) return;

		let action = async(
			updateFeature(this._controllerName, this._id, featureId, feature),
		);

		if (quiet) {
			action = quietAction(action);
		}

		this._dispatchIfPossible(action);
	}

	updateFeatures(features: Feature[], {quiet = false} = {}) {
		if (!this._controllerName || !this._id) return;

		let action = async(
			updateFeatures(this._controllerName, this._id, features),
		);

		if (quiet) {
			action = quietAction(action);
		}

		this._dispatchIfPossible(action);
	}

	updateFeatureGeometry(
		featureId: string,
		geometry: Geometry,
		{quiet = false} = {},
	) {
		if (!this._controllerName || !this._id) return;

		let action = async(
			updateFeatureGeometry(
				this._controllerName,
				this._id,
				featureId,
				geometry,
			),
		);

		if (quiet) {
			action = quietAction(action);
		}

		this._dispatchIfPossible(action);
	}

	removeFeature(featureId: string) {
		if (!this._controllerName || !this._id) return;

		this._dispatchIfPossible(
			async(removeFeature(this._controllerName, this._id, featureId)),
		);
	}

	clear() {
		if (!this._controllerName || !this._id) return;

		this._dispatchIfPossible(
			async(removeAllFeatures(this._controllerName, this._id)),
		);
	}

	setId(id: string) {
		this._id = id;
		this._subscribeFeatureSource();
	}

	setStore(store: EnhancedStore) {
		this._store = store;
		this._subscribeFeatureSource();
	}

	setControllerName(featureSourcesControllerName: string) {
		this._controllerName = featureSourcesControllerName;
		this._subscribeFeatureSource();
	}

	setTargetControllerName(ctrName: string) {
		this._targetControllerName = ctrName;
		this._subscribeFeatureSource();
	}

	setInternalProjection(projection: ProjectionLike) {
		this._internalProjection = projection;
		this._subscribeFeatureSource();
	}

	setProjection(projection: ProjectionLike) {
		this._externalProjection = projection;
		this._subscribeFeatureSource();
	}

	_subscribeFeatureSource() {
		if (this._unsubscribeFeatureSource) {
			this._unsubscribeFeatureSource();
			this._source = null;
			this._unsubscribeFeatureSource = null;
		}

		if (
			this._id &&
			this._store &&
			this._controllerName &&
			this._targetControllerName
		) {
			const {instance, unsubscribe} =
				SharedReadonlyVectorFeatureSource.subscribe(
					this._store,
					this._controllerName,
					this._id,
					this._targetControllerName,
					this._format,
					this._internalProjection,
					this._externalProjection,
					this._onUpdate,
				);
			this._source = instance;
			this._unsubscribeFeatureSource = unsubscribe;
		}
	}
}
