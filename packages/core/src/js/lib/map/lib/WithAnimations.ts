import type OlFeature from "ol/Feature";
import type {AnimationOptions, FitOptions} from "ol/View";
import type {Extent} from "ol/extent";
import type {SimpleGeometry} from "ol/geom";

import type {ExtendedFitOptions} from "@mapsight/lib-ol/map/fitToExtent";
import fitMapViewToFeature from "@mapsight/lib-ol/map/fitToFeature";
import fitMapViewToFeatures from "@mapsight/lib-ol/map/fitToFeatures";
import type {CenterOnFeatureOptions} from "@mapsight/lib-ol/view/centerOnFeature";
import centerViewOnFeature from "@mapsight/lib-ol/view/centerOnFeature";
import centerViewOnFeatures from "@mapsight/lib-ol/view/centerOnFeatures";

import type {Reducer} from "@/types";

import {ANIMATE} from "../actions";
import WithMap from "./WithMap";

type AnimationFunction = () => void;

export default class WithAnimations extends WithMap {
	_pendingAnimation: AnimationFunction | null = null;

	_enqueueAnimation(animationFunction: AnimationFunction) {
		const map = this.getMap();
		this._pendingAnimation = animationFunction;
		map?.render(); // trigger render to ensure the animation is fulfilled timely
	}

	override init() {
		const map = this.getMap();
		if (!map) {
			console.error(
				"Could not initialize WithAnimations mixin: map is not defined",
			);
			return;
		}

		const postRenderAnimationHandler = () => {
			if (this._pendingAnimation && map.getSize()) {
				this._pendingAnimation();
				this._pendingAnimation = null;
			}
		};

		map.on("postrender", postRenderAnimationHandler);

		const reduceWithAnimations: Reducer = (state = {}, action) => {
			if (action.type === ANIMATE) {
				const {center, resolution, bounds, zoom, ...options} =
					action.options;

				if (bounds) {
					this.fit(bounds, options);
				} else {
					const view = map.getView();
					this.animate({
						zoom: resolution
							? view.getZoomForResolution(resolution)
							: zoom,
						center: center,
						...options,
					});
				}
			}

			return state;
		};

		this.registerReducer(reduceWithAnimations);
	}

	fit(bounds: SimpleGeometry | Extent, options?: FitOptions) {
		this._enqueueAnimation(() => {
			this.getMap()?.getView().fit(bounds, options);
		});
	}

	animate(options: AnimationOptions) {
		this._enqueueAnimation(() => {
			this.getMap()?.getView().animate(options);
		});
	}

	// TODO: make this an action?
	fitMapViewToFeatures(features: OlFeature[], options?: ExtendedFitOptions) {
		this._enqueueAnimation(() => {
			const map = this.getMap();
			if (map) {
				fitMapViewToFeatures(map, features, options);
			}
		});
	}

	// TODO: make this an action?
	fitMapViewToFeature(feature: OlFeature, options?: ExtendedFitOptions) {
		this._enqueueAnimation(() => {
			const map = this.getMap();
			if (map) {
				fitMapViewToFeature(map, feature, options);
			}
		});
	}

	// TODO: make this an action?
	centerViewOnFeatures(
		features: OlFeature[],
		options?: CenterOnFeatureOptions,
	) {
		this._enqueueAnimation(() => {
			const map = this.getMap();
			if (map) {
				centerViewOnFeatures(map.getView(), features, options);
			}
		});
	}

	// TODO: make this an action?
	centerViewOnFeature(feature: OlFeature, options?: CenterOnFeatureOptions) {
		this._enqueueAnimation(() => {
			const map = this.getMap();
			if (map) {
				centerViewOnFeature(map.getView(), feature, options);
			}
		});
	}
}
