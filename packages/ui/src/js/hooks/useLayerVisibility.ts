import {useCallback, useMemo} from "react";
import {useSelector, useStore} from "react-redux";

import {setLayerVisibility} from "@mapsight/core/lib/map/actions";
import type {MapState} from "@mapsight/core/lib/map/types";
import type {State} from "@mapsight/core/types";

import {MAP} from "../config/constants/controllers";

/**
 * Visibility of a layer and a setter for it. An existing layer defaults to
 * visible when its option is omitted, as in OpenLayers. Missing layers count
 * as hidden and the setter only changes existing layers.
 *
 * @param layerId Id of the layer in the map state.
 * @param mapControllerName Map controller name. @default `"map"`
 */
function useLayerVisibility(
	layerId: string,
	mapControllerName: string = MAP,
): readonly [visible: boolean, setVisible: (visible: boolean) => void] {
	const store = useStore<State>();
	const visible = useSelector((state: State) => {
		const map = state[mapControllerName] as MapState | undefined;
		const layers = map?.layers;
		const layer =
			layers && Object.hasOwn(layers, layerId)
				? layers[layerId]
				: undefined;
		return !!layer && layer.options?.visible !== false;
	});

	const setVisible = useCallback(
		(nextVisible: boolean) => {
			const map = store.getState()[mapControllerName] as
				MapState | undefined;
			const layers = map?.layers;
			if (layers && Object.hasOwn(layers, layerId) && layers[layerId]) {
				store.dispatch(
					setLayerVisibility(mapControllerName, layerId, nextVisible),
				);
			}
		},
		[store, mapControllerName, layerId],
	);

	return useMemo(() => [visible, setVisible] as const, [visible, setVisible]);
}

export default useLayerVisibility;
