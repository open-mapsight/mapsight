import {useSelector} from "react-redux";

import type {LayerAttributions} from "@mapsight/core/lib/map/selectors";
import {visibleLayerAttributionsSelector} from "@mapsight/core/lib/map/selectors";
import type {MapState} from "@mapsight/core/lib/map/types";
import type {State} from "@mapsight/core/types";

import {MAP} from "../config/constants/controllers";

const NO_ATTRIBUTIONS: LayerAttributions = {};

/**
 * Attribution strings of the layers that are currently rendered, keyed by
 * layer id. Layers without an attribution are left out.
 *
 * The strings come from layer `metaData.attribution` and may contain markup.
 * Render them as text unless the layer config is trusted content.
 *
 * @param mapControllerName Map controller name. @default `"map"`
 */
function useVisibleLayerAttributions(
	mapControllerName: string = MAP,
): LayerAttributions {
	return (
		useSelector((state: State) =>
			visibleLayerAttributionsSelector(
				state[mapControllerName] as MapState,
			),
		) ?? NO_ATTRIBUTIONS
	);
}

export default useVisibleLayerAttributions;
