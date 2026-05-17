import type {FeatureLike} from "ol/Feature";
import type OlMap from "ol/Map";
import type MapBrowserEvent from "ol/MapBrowserEvent";
import type Layer from "ol/layer/Layer";

type Options = {
	layers?: Array<Layer>;
	onEnter?: (feature: FeatureLike) => void;
	onLeave?: (feature: FeatureLike) => void;
};

export default function detectFeatureHits(map: OlMap, options: Options = {}) {
	let previousFeature: FeatureLike | null = null;

	const {layers, onEnter, onLeave} = options;
	const layerFilter =
		layers && layers.length
			? (layer: Layer) => layers.indexOf(layer) > -1
			: undefined;

	function onFeatureHit(feature: FeatureLike, layer: Layer) {
		if (!layer || feature === previousFeature) {
			return;
		}

		if (previousFeature) {
			onLeave?.(previousFeature);
		}

		previousFeature = feature;
		onEnter?.(feature);
	}

	function onPointerMove(e: MapBrowserEvent) {
		if (e.dragging) {
			return;
		}
		const pixel = map.getEventPixel(e.originalEvent);

		let foundFeature = false;
		map.forEachFeatureAtPixel(
			pixel,
			(feature, layer) => {
				foundFeature = true;
				onFeatureHit(feature, layer);
			},
			{layerFilter: layerFilter},
		);

		if (!foundFeature && previousFeature) {
			onLeave?.(previousFeature);
			previousFeature = null;
		}
	}

	map.on("pointermove", onPointerMove);
}
