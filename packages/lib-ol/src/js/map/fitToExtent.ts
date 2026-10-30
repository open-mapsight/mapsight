import type OlMap from "ol/Map";
import type {FitOptions} from "ol/View";
import type {Extent} from "ol/extent";

import isFiniteExtent from "../extent/isFiniteExtent";
import type {Padding} from "../index";
import containsExtentWithPadding from "./containsExtentWithPadding";

export type ExtendedFitOptions = FitOptions & {
	/**
	 * Keep the current view zoom when fitting: `maxZoom` is clamped to the
	 * current zoom, so the view may still zoom out to fit the extent but
	 * never zooms in past where the user already is.
	 */
	keepZoom: boolean;
	/**
	 * Skip the fit entirely when the extent is already fully visible in the
	 * current viewport (including `padding`), avoiding needless animation on
	 * repeated calls.
	 */
	skipIfInView: boolean;
};

/** Default duration of the fit animation, in milliseconds. */
export const DEFAULT_FIT_DURATION = 300;

/**
 * Default padding around the fitted extent, in pixels, as
 * `[top, right, bottom, left]`.
 */
export const DEFAULT_FIT_PADDING: Padding = [60, 100, 60, 100];

/** Default `maxZoom` applied when fitting an extent. */
export const DEFAULT_FIT_MAX_ZOOM = 17;

export const DEFAULT_OPTIONS: ExtendedFitOptions = {
	duration: DEFAULT_FIT_DURATION,
	padding: DEFAULT_FIT_PADDING,
	keepZoom: false,
	maxZoom: DEFAULT_FIT_MAX_ZOOM,
	skipIfInView: true,
};

/**
 * Fits the view to the given extent, animating over `duration`. Ignores
 * non-finite extents. See {@link ExtendedFitOptions} for `keepZoom` and
 * `skipIfInView`.
 */
export default function fitToExtent(
	map: OlMap,
	extent: Extent,
	options: ExtendedFitOptions = DEFAULT_OPTIONS,
) {
	if (!isFiniteExtent(extent)) {
		return;
	}

	const padding = (options.padding || [0, 0, 0, 0]) as Padding;

	if (
		options.skipIfInView === false ||
		!containsExtentWithPadding(map, extent, padding)
	) {
		const view = map.getView();
		view.fit(extent, {
			...options,
			maxZoom: options.keepZoom ? view.getZoom() : options.maxZoom,
		});
	}
}
