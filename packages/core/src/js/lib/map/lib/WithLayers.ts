import LayerGroup from "ol/layer/Group";
import type Layer from "ol/layer/Layer";
import VectorSource from "ol/source/Vector";

import forEach from "lodash/forEach";

import {ensureNonNullable} from "@mapsight/lib-js/nonNullable";
import matchesPath from "@mapsight/lib-redux/matchesPath";
import reducers from "@mapsight/lib-redux/reducers/immutable-path";

import type {MapController} from "@/lib/map/controller";
import type {LayerConfig} from "@/lib/map/schema";
import {di, updateProxyObject} from "@/ol-proxy/index";

import {ACTION_SET} from "../../base/reducer";
import {
	FIT_MAP_VIEW_TO_LAYER_FEATURE,
	FIT_MAP_VIEW_TO_LAYER_SOURCE_EXTENT,
} from "../actions";
import WithAnimations from "./WithAnimations";
import proxyPassOpenLayersEventsToMapController from "./proxyPassOpenLayersEventsToMapController";
import {getGroupForLayer, tagLayer} from "./tagLayer";

export type LayerDefinition = LayerConfig;

export const LAYER_GROUP_DEFAULT = "default";

export default class WithLayers extends WithAnimations {
	private _layers: Record<string, Layer> = {};

	private _groups: Record<
		string,
		{id: string; groupLayer: LayerGroup; layers: Record<string, Layer>}
	> = {};

	private getOrCreateLayerGroup(id: string): LayerGroup {
		const map = this.getMap();

		const groupLayer = this._groups[id]?.groupLayer;
		if (groupLayer !== undefined) {
			return groupLayer;
		}

		const groupLayer2 = new LayerGroup();
		tagLayer(groupLayer2, this, id);
		this._groups[id] = {id: id, groupLayer: groupLayer2, layers: {}};

		if (map) {
			map.addLayer(groupLayer2);
		} else {
			console.warn(
				"Could not get or create layer group. Map is not set.",
			);
		}

		return groupLayer2;
	}

	override init() {
		this._layers = {};
		this._groups = {};

		const updateLayer = (
			id: string,
			newDefinition: LayerDefinition | undefined,
			oldDefinitions: Record<string, LayerDefinition>,
		) => {
			const oldDefinition = oldDefinitions[id];

			// update layer
			updateProxyObject({
				di: di,
				oldObject: this._layers[id],
				oldDefinition: oldDefinition,
				newDefinition,
				remover: (oldObject) => {
					const group =
						getGroupForLayer(oldObject) || LAYER_GROUP_DEFAULT;
					this._groups[group]?.groupLayer
						.getLayers()
						.remove(oldObject);
					delete this._layers[id];
					delete this._groups[group]?.layers[id];
				},
				adder: (layer) => {
					if (!newDefinition) {
						return;
					}

					const group =
						(typeof newDefinition.group === "string"
							? newDefinition.group
							: newDefinition.metaData?.group) ||
						LAYER_GROUP_DEFAULT;
					const layerGroup = this.getOrCreateLayerGroup(group);
					this._layers[id] = layer;
					ensureNonNullable(this._groups[group]).layers[id] = layer;
					tagLayer(layer, this, id, group);
					layerGroup.getLayers().push(layer);
					proxyPassOpenLayersEventsToMapController(
						this as unknown as MapController,
						layer,
						newDefinition.type,
						id,
					);
				},
				parentObject: this,
			});
		};

		this.getAndObserveUncontrolled(
			(state) => state.layers as Record<string, LayerDefinition>,
			function updateLayers(newDefinitions = {}, oldDefinitions = {}) {
				forEach(oldDefinitions, (_, id) =>
					updateLayer(id, newDefinitions[id], oldDefinitions),
				);
				forEach(newDefinitions, (newDefinition, id) =>
					updateLayer(id, newDefinition, oldDefinitions),
				);
			},
		);

		this.registerReducer((state, action) => {
			// layer based animation
			if (action.type === FIT_MAP_VIEW_TO_LAYER_SOURCE_EXTENT) {
				const [_matches, {layerId}] = matchesPath(
					action.path,
					"layers/:layerId",
				);
				if (layerId !== undefined && this._layers[layerId]) {
					const source = this._layers[layerId]?.getSource();
					if (source instanceof VectorSource) {
						const sourceExtent = source.getExtent();
						if (sourceExtent) {
							this.fit(sourceExtent, action.options);
						}
					}
				}
			}

			if (action.type === FIT_MAP_VIEW_TO_LAYER_FEATURE) {
				const [_matches, {layerId}] = matchesPath(
					action.path,
					"layers/:layerId",
				);
				if (layerId !== undefined && this._layers[layerId]) {
					const source = this._layers[layerId]?.getSource();
					if (source instanceof VectorSource) {
						const feature = source.getFeatureById(action.featureId);
						if (feature) {
							this.fitMapViewToFeature(feature, action.options);
						}
					}
				}
			}

			// enforce only one base layer being visible at once
			if (action.type === ACTION_SET && action.value === true) {
				const [_matches, {layerId}] = matchesPath(
					action.path,
					"layers/:layerId/options/visible",
				);
				if (
					layerId !== undefined &&
					state.layers[layerId]?.metaData?.isBaseLayer
				) {
					// go through all base layers and set invisible
					for (const id of Object.keys(state.layers)) {
						if (state.layers[id]?.metaData?.isBaseLayer) {
							state = reducers.set?.(state, {
								type: "set",
								value: false,
								path: ["layers", id, "options", "visible"],
							});
						}
					}
				}
			}

			return state;
		});
	}
}
