import type Feature from "ol/Feature";
import type OlMap from "ol/Map";
import type BaseLayer from "ol/layer/Base";
import LayerGroup from "ol/layer/Group";
import Layer from "ol/layer/Layer";
import type Source from "ol/source/Source";
import type VectorFeatureSource from "ol/source/Vector";

export default function getLayer(map: OlMap, feature: Feature) {
	let featureLayer: null | Layer = null;

	function checkLayerForFeature(layer: BaseLayer): boolean {
		if (layer instanceof LayerGroup) {
			return layer.getLayers().getArray().some(checkLayerForFeature);
		}

		if (layer instanceof Layer) {
			const source = layer.getSource() as
				| VectorFeatureSource
				| Source
				| null;

			if (
				source &&
				"getFeatures" in source &&
				source.getFeatures().some((a) => a === feature)
			) {
				featureLayer = layer;
				return true;
			}
		}

		return false;
	}

	map.getLayers().getArray().some(checkLayerForFeature);

	return featureLayer;
}
