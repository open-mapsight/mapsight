import type OlFeature from "ol/Feature";
import type OlLayer from "ol/layer/Layer";

import forEach from "lodash/forEach";

import type {LayerDefinition} from "@/lib/map/lib/WithLayers";
import type {VectorFeatureSourceLayer} from "@/lib/map/types";
import {di, updateProxyObject} from "@/ol-proxy";

import WithMap from "./WithMap";
import {getIdForLayer, tagLayer} from "./tagLayer";

export const Z_INDEX_OVERLAY = 2;
export const LAYER_GROUP_DEFAULT = "default";
export const LAYER_TYPE = "VectorOverlayLayer";

function getOverlayFeatureCollectionForLayer(
	overlays: Record<string, VectorFeatureSourceLayer>,
	layer: OlLayer,
) {
	const layerId = getIdForLayer(layer);
	return layerId
		? overlays[layerId]?.getSource()?.getFeaturesCollection()
		: undefined;
}

export default class WithLayerOverlays extends WithMap {
	private _overlays: Record<string, VectorFeatureSourceLayer> = {};

	override init() {
		this._overlays = {};

		const updateLayerOverlay = (
			id: string,
			newDefinition: LayerDefinition | undefined,
			oldDefinitions: Record<string, LayerDefinition>,
		) => {
			const oldDefinition = oldDefinitions[id];
			const overlayDefinition = newDefinition && {
				zIndex: Z_INDEX_OVERLAY,
				...newDefinition,
			};

			// update overlay
			// TODO: make overlay optional?
			const featureSelections = overlayDefinition?.options?.selections;
			updateProxyObject({
				di: di,
				oldObject: this._overlays[id],
				oldDefinition: oldDefinition
					? {...oldDefinition, type: LAYER_TYPE}
					: undefined,
				newDefinition:
					featureSelections && overlayDefinition
						? {...overlayDefinition, type: LAYER_TYPE}
						: undefined,
				remover: () => {
					this._overlays[id]?.setMap(null);
					delete this._overlays[id];
				},
				adder: (overlay) => {
					overlay.setMap(this.getMap());
					this._overlays[id] = overlay;
					tagLayer(overlay, this, id);
				},
				parentObject: this,
			});
		};

		this.getAndObserveUncontrolled(
			(state) => state.layers as Record<string, LayerDefinition>,
			function updateLayerOverlays(
				newDefinitions = {},
				oldDefinitions = {},
			) {
				forEach(oldDefinitions, (_, id) =>
					updateLayerOverlay(id, newDefinitions[id], oldDefinitions),
				);
				forEach(newDefinitions, (newDefinition, id) =>
					updateLayerOverlay(id, newDefinition, oldDefinitions),
				);
			},
		);
	}

	moveFeatureToOverlay(layer: VectorFeatureSourceLayer, feature: OlFeature) {
		const overlayFeatureCollection = getOverlayFeatureCollectionForLayer(
			this._overlays,
			layer,
		);
		if (
			overlayFeatureCollection &&
			overlayFeatureCollection.getArray().indexOf(feature) === -1
		) {
			overlayFeatureCollection.push(feature);
		}
	}

	removeFeatureFromOverlay(
		layer: VectorFeatureSourceLayer,
		feature: OlFeature,
	) {
		const overlayFeatureCollection = getOverlayFeatureCollectionForLayer(
			this._overlays,
			layer,
		);
		if (overlayFeatureCollection) {
			overlayFeatureCollection.remove(feature);
		}
	}
}
