import {shallowEqual, useSelector} from "react-redux";

import type {LayerAttributions} from "@mapsight/core/lib/map/selectors";
import {visibleLayerAttributionsSelector} from "@mapsight/core/lib/map/selectors";
import type {MapState} from "@mapsight/core/lib/map/types";
import type {State} from "@mapsight/core/types";

import {MAP} from "../config/constants/controllers";

const NO_ATTRIBUTIONS: LayerAttributions = {};

/**
 * Attribution strings of the layers that are currently rendered, keyed by
 * layer id. Layers without an attribution are left out. Empty while the map
 * controller has no state yet.
 *
 * The strings come from layer `metaData.attribution` and may contain markup.
 * Render them as text unless the layer config is trusted content.
 *
 * @param mapControllerName Map controller name. @default `"map"`
 */
function useVisibleLayerAttributions(
	mapControllerName: string = MAP,
): LayerAttributions {
	// The selector builds a new object whenever its inputs change, also when
	// the attributions stay the same (other layer options changed, or no layer
	// is visible). Compare by content to skip those renders.
	return (
		useSelector((state: State) => {
			const map = state[mapControllerName] as MapState | undefined;
			return map ? visibleLayerAttributionsSelector(map) : null;
		}, shallowEqual) ?? NO_ATTRIBUTIONS
	);
}

export default useVisibleLayerAttributions;
