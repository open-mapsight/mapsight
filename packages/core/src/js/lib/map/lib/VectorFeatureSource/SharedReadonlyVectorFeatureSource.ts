import type OlFeature from "ol/Feature";
import type FeatureFormat from "ol/format/Feature";
import type GeoJSONFormat from "ol/format/GeoJSON";
import type OlGeometry from "ol/geom/Geometry";
import type {ProjectionLike} from "ol/proj";
import VectorSource from "ol/source/Vector";

import type {Unsubscribe} from "redux";

import {getAndObserveState} from "@mapsight/lib-redux/observe-state";

import {createFilteredFeatureSourceSelector} from "@/lib/feature-sources/selectors";
import type {FeatureSourceState} from "@/lib/feature-sources/types";
import type {EnhancedStore} from "@/types";

import {updateFeaturesInSource} from "./updateFeaturesInSource";

const listenerStoreMaps = new WeakMap();

type FeatureSourceListener = () => void;

export type BasicFeatureFormat = FeatureFormat<
	OlFeature<
		OlGeometry,
		{
			[p: string]: unknown;
		}
	>
>;

class SharedReadonlyVectorFeatureSource extends VectorSource {
	private readonly _store: EnhancedStore;

	private readonly _controllerName: string;
	private readonly _id: string;
	private readonly _targetControllerName: string;
	private readonly _internalProjection: ProjectionLike | undefined;
	private readonly _externalProjection: ProjectionLike | undefined;

	private _listeners: Array<FeatureSourceListener>;
	private _unsubscribeFromStore: (() => void) | undefined = undefined;
	private _format: GeoJSONFormat;

	constructor(
		store: EnhancedStore,
		controllerName: string,
		id: string,
		targetControllerName: string,
		format: GeoJSONFormat,
		internalProjection?: ProjectionLike,
		externalProjection?: ProjectionLike,
	) {
		super({format});

		this._listeners = [];
		this._store = store;
		this._controllerName = controllerName;
		this._id = id;
		this._targetControllerName = targetControllerName;
		this._format = format;
		this._internalProjection = internalProjection;
		this._externalProjection = externalProjection;
	}

	static subscribe(
		store: EnhancedStore,
		controllerName: string,
		id: string,
		targetControllerName: string,
		format: GeoJSONFormat,
		internalProjection: ProjectionLike | undefined,
		externalProjection: ProjectionLike | undefined,
		listener: FeatureSourceListener,
	) {
		let map;
		if (listenerStoreMaps.has(store)) {
			map = listenerStoreMaps.get(store);
		} else {
			map = new Map();
			listenerStoreMaps.set(store, map);
		}

		const hash = JSON.stringify([
			controllerName,
			id,
			targetControllerName,
			externalProjection,
			internalProjection,
			format.constructor.name,
		]);

		let instance: SharedReadonlyVectorFeatureSource & {__hash?: string};
		if (!map.has(hash)) {
			instance = new SharedReadonlyVectorFeatureSource(
				store,
				controllerName,
				id,
				targetControllerName,
				format,
				internalProjection,
				externalProjection,
			);
			instance.__hash = hash;
			map.set(hash, instance);
		} else {
			instance = map.get(hash);
		}

		return {instance: instance, unsubscribe: instance.subscribe(listener)};
	}

	isAbandoned() {
		return this._listeners.length < 1;
	}

	subscribe(listener: FeatureSourceListener) {
		if (this.isAbandoned()) {
			this._unsubscribeFromStore = this._subscribeToSource();
		}

		this._listeners.push(listener);

		return () => {
			this._listeners = this._listeners.filter((f) => f !== listener);
			if (this._unsubscribeFromStore && this.isAbandoned()) {
				this._unsubscribeFromStore();
			}
		};
	}

	private _subscribeToSource(): Unsubscribe {
		const handleFeatureSourceStateChange = (
			sourceState: FeatureSourceState | undefined,
		) => {
			if (!sourceState) {
				return;
			}

			if (sourceState.error) {
				console.info(
					`SharedReadonlyVectorFeatureSource error [${this._controllerName}, ${this._id}]`,
					sourceState.error,
				);
				return;
			}

			if (sourceState.data) {
				// try to read from feature source
				let newFeatures;
				try {
					newFeatures = this._format.readFeatures(sourceState.data, {
						dataProjection:
							this._format.readProjection(sourceState.data) ||
							this._externalProjection,
						featureProjection: this._internalProjection,
					}) as Array<OlFeature>;

					updateFeaturesInSource(this, newFeatures);

					this._listeners.forEach((listener) => listener());
				} catch (_e) {
					// TODO: Should we report exceptions with reading the data?
				}
			}
		};
		const selector = createFilteredFeatureSourceSelector(
			this._controllerName,
			this._id,
			this._targetControllerName,
		);

		return getAndObserveState(
			this._store,
			selector,
			handleFeatureSourceStateChange,
		);
	}
}

export default SharedReadonlyVectorFeatureSource;
