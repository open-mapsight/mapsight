import type OlMap from "ol/Map";
import type BaseLayer from "ol/layer/Base";
import BaseVectorLayer from "ol/layer/BaseVector";
import VectorSource from "ol/source/Vector";

type IdleScheduler = (callback: () => void) => void;

const scheduleIdle: IdleScheduler = (callback) => {
	if (typeof requestIdleCallback === "function") {
		requestIdleCallback(callback, {timeout: 3000});
	} else {
		setTimeout(callback, 1000);
	}
};

function hasRenderableFeatures(layer: BaseLayer): boolean {
	if (!(layer instanceof BaseVectorLayer) || !layer.getVisible()) {
		return false;
	}
	const source: unknown = layer.getSource();
	// Vector tile sources have no feature list up front; their tiles render
	// through the same executor groups.
	return source instanceof VectorSource ? !source.isEmpty() : !!source;
}

/**
 * OpenLayers (10.x) benchmarks canvas reads on the first hit detection of a
 * rendered vector layer: three 50 ms busy loops in `ExecutorGroup` to choose
 * `willReadFrequently`. Without this, those 150 ms land on the user's first
 * hover or tap on the map. Run that first hit detection while the page is
 * idle, once a visible vector layer with features has rendered.
 *
 * Returns a function that cancels the warm-up if it has not run yet.
 */
export function warmUpHitDetection(
	map: OlMap,
	isNeeded: () => boolean,
	schedule: IdleScheduler = scheduleIdle,
): () => void {
	let done = false;
	const onRenderComplete = () => {
		if (
			done ||
			!isNeeded() ||
			!map.getAllLayers().some(hasRenderableFeatures)
		) {
			return;
		}
		done = true;
		map.un("rendercomplete", onRenderComplete);
		schedule(() => {
			const [width, height] = map.getSize() ?? [];
			if (width && height) {
				map.forEachFeatureAtPixel([width / 2, height / 2], () => true);
			}
		});
	};
	map.on("rendercomplete", onRenderComplete);
	return () => {
		done = true;
		map.un("rendercomplete", onRenderComplete);
	};
}
