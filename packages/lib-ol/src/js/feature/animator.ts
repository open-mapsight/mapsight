// EXAMPLE:
//
//var animator = FeatureAnimator(ol, map, function (feature, vectorContext, time) {
//	switch (feature.getGeometry().getType()) {
//		case 'Polygon':
//			var strokeStyle = new ol.style.Stroke({
//				color: 'red',
//				width: 4 * ol.easing.easeOut(time)
//			});
//			var fillStyle = new ol.style.Fill({
//				color: 'yellow'
//			});
//
//			vectorContext.setFillStrokeStyle(fillStyle, strokeStyle);
//			vectorContext.drawPolygonGeometry(feature.getGeometry().clone(), null);
//
//			break;
//		default:
//	}
//});
//
//if (!ol.has.TOUCH) {
//	FeatureHitDetector(
//		map,
//		function (feature) {
//			animator.start(feature);
//			map.render();
//			$map.addClass('feature-is-hit');
//		},
//		function (feature) {
//			animator.stop();
//			map.render();
//			$map.removeClass('feature-is-hit');
//		}
//	);
//}
import type Feature from "ol/Feature";
import type OlMap from "ol/Map";
import {unByKey} from "ol/Observable";
import type {EventsKey} from "ol/events";
import {getVectorContext} from "ol/render";
import type RenderEvent from "ol/render/Event";
import type VectorContext from "ol/render/VectorContext";

export type AnimationFunction = (
	feature: Feature,
	vectorContext: VectorContext,
	progress: number,
) => void;

export default function animator(
	map: OlMap,
	animationFunction: AnimationFunction,
	duration = 2000,
) {
	let listenerKey: EventsKey;
	let isStopped = true;

	function start(feature: Feature) {
		const startTime = new Date().getTime();

		function animate(event: RenderEvent) {
			if (isStopped || !event.frameState) {
				return;
			}

			const vectorContext = getVectorContext(event);

			const elapsedTime = event.frameState.time - startTime;
			animationFunction(feature, vectorContext, elapsedTime / duration);

			if (elapsedTime > duration) {
				stop();
			} else {
				event.frameState.animate = true; // tell OL3 to continue postcompose animation
			}
		}

		isStopped = false;
		listenerKey = map.on("postcompose", animate);
	}

	function stop() {
		if (!isStopped) {
			isStopped = true;
			unByKey(listenerKey);
		}
	}

	return {start: start, stop: stop};
}
