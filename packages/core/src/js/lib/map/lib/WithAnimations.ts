import type OlFeature from "ol/Feature";
import type {AnimationOptions, FitOptions} from "ol/View";
import type {Extent} from "ol/extent";
import type {SimpleGeometry} from "ol/geom";

import {
	DEFAULT_OPTIONS as DEFAULT_FIT_OPTIONS,
	type ExtendedFitOptions,
} from "@mapsight/lib-ol/map/fitToExtent";
import fitMapViewToFeature from "@mapsight/lib-ol/map/fitToFeature";
import fitMapViewToFeatures from "@mapsight/lib-ol/map/fitToFeatures";
import {
	type CenterOnFeatureOptions,
	DEFAULT_OPTIONS as DEFAULT_CENTER_OPTIONS,
} from "@mapsight/lib-ol/view/centerOnFeature";
import centerViewOnFeature from "@mapsight/lib-ol/view/centerOnFeature";
import centerViewOnFeatures from "@mapsight/lib-ol/view/centerOnFeatures";

import {ANIMATE} from "../actions";
import WithMap from "./WithMap";
import runWithMotionPreference from "./runWithMotionPreference";

type AnimationFunction = (reducedMotion: boolean) => void;

function motionOptions<T extends {duration?: number}>(
	options: T | undefined,
	reducedMotion: boolean,
	defaults?: T,
): T | undefined {
	return reducedMotion
		? ({...(options ?? defaults), duration: 0} as T)
		: options;
}

export default class WithAnimations extends WithMap {
	_pendingAnimation: (() => void) | null = null;
	private _stopMotionPreference?: () => void;

	_enqueueAnimation(animationFunction: AnimationFunction) {
		const map = this.getMap();
		this._pendingAnimation = () => {
			this._stopMotionPreference?.();
			if (map)
				this._stopMotionPreference = runWithMotionPreference(
					map,
					animationFunction,
				);
		};
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

		this.registerReducer((state, action) => {
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
		});
	}

	fit(bounds: SimpleGeometry | Extent, options?: FitOptions) {
		this._enqueueAnimation((reducedMotion) => {
			this.getMap()
				?.getView()
				.fit(bounds, motionOptions(options, reducedMotion));
		});
	}

	animate(options: AnimationOptions) {
		this._enqueueAnimation((reducedMotion) => {
			this.getMap()
				?.getView()
				.animate(motionOptions(options, reducedMotion)!);
		});
	}

	// TODO: make this an action?
	fitMapViewToFeatures(features: OlFeature[], options?: ExtendedFitOptions) {
		this._enqueueAnimation((reducedMotion) => {
			const map = this.getMap();
			if (map) {
				fitMapViewToFeatures(
					map,
					features,
					motionOptions(options, reducedMotion, DEFAULT_FIT_OPTIONS),
				);
			}
		});
	}

	// TODO: make this an action?
	fitMapViewToFeature(feature: OlFeature, options?: ExtendedFitOptions) {
		this._enqueueAnimation((reducedMotion) => {
			const map = this.getMap();
			if (map) {
				fitMapViewToFeature(
					map,
					feature,
					motionOptions(options, reducedMotion, DEFAULT_FIT_OPTIONS),
				);
			}
		});
	}

	// TODO: make this an action?
	centerViewOnFeatures(
		features: OlFeature[],
		options?: CenterOnFeatureOptions,
	) {
		this._enqueueAnimation((reducedMotion) => {
			const map = this.getMap();
			if (map) {
				centerViewOnFeatures(
					map.getView(),
					features,
					motionOptions(
						options,
						reducedMotion,
						DEFAULT_CENTER_OPTIONS,
					),
				);
			}
		});
	}

	// TODO: make this an action?
	centerViewOnFeature(feature: OlFeature, options?: CenterOnFeatureOptions) {
		this._enqueueAnimation((reducedMotion) => {
			const map = this.getMap();
			if (map) {
				centerViewOnFeature(
					map.getView(),
					feature,
					motionOptions(
						options,
						reducedMotion,
						DEFAULT_CENTER_OPTIONS,
					),
				);
			}
		});
	}
}
