import type OlFeature from "ol/Feature";
import type OlLayer from "ol/layer/Layer";
import type VectorSource from "ol/source/Vector";

import forEach from "lodash/forEach";

import type {LayerDefinition} from "@/lib/map/lib/WithLayers";
import {Z_INDEX_OVERLAY} from "@/lib/map/z-index";
import {di, updateProxyObject} from "@/ol-proxy";

import WithMap from "./WithMap";
import {getIdForLayer, tagLayer} from "./tagLayer";

export {Z_INDEX_OVERLAY};
export const LAYER_GROUP_DEFAULT = "default";
export const LAYER_TYPE = "VectorOverlayLayer";

type VectorOverlayLayer = OlLayer<VectorSource>;

function getOverlayFeatureCollectionForLayer(
	overlays: Record<string, VectorOverlayLayer>,
	layer: OlLayer,
) {
	const layerId = getIdForLayer(layer);
	return layerId
		? overlays[layerId]?.getSource()?.getFeaturesCollection()
		: undefined;
}

export default class WithLayerOverlays extends WithMap {
	private _overlays: Record<string, VectorOverlayLayer> = {};

	override init() {
		this._overlays = {};

		const updateLayerOverlay = (
			id: string,
			newDefinition: LayerDefinition | undefined,
			oldDefinitions: Record<string, LayerDefinition>,
		) => {
			const oldDefinition = oldDefinitions[id];
			const overlayDefinition = newDefinition && {
				...newDefinition,
				zIndex: Z_INDEX_OVERLAY,
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
				remover: (overlay) => {
					overlay.setMap(null);
					delete this._overlays[id];
					const source = overlay.getSource();
					source?.clear(true);
					overlay.dispose();
					source?.dispose();
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

	moveFeatureToOverlay(layer: OlLayer, feature: OlFeature) {
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

	removeFeatureFromOverlay(layer: OlLayer, feature: OlFeature) {
		const overlayFeatureCollection = getOverlayFeatureCollectionForLayer(
			this._overlays,
			layer,
		);
		if (overlayFeatureCollection) {
			overlayFeatureCollection.remove(feature);
		}
	}
}
