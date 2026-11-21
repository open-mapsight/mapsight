import {useCallback, useMemo} from "react";
import {useDispatch, useSelector} from "react-redux";

import {setLayerVisibility} from "@mapsight/core/lib/map/actions";
import {makeLayerVisibleSelector} from "@mapsight/core/lib/map/selectors";
import type {MapState} from "@mapsight/core/lib/map/types";
import type {State} from "@mapsight/core/types";

import {MAP} from "../config/constants/controllers";

/**
 * Visibility of a layer and a setter for it. A layer that does not exist or
 * has no `visible` option counts as not visible, and so does every layer while
 * the map controller has no state yet.
 *
 * @param layerId Id of the layer in the map state.
 * @param mapControllerName Map controller name. @default `"map"`
 */
function useLayerVisibility(
	layerId: string,
	mapControllerName: string = MAP,
): readonly [visible: boolean, setVisible: (visible: boolean) => void] {
	const dispatch = useDispatch();
	const selectVisible = useMemo(
		() => makeLayerVisibleSelector(layerId),
		[layerId],
	);
	const visible = useSelector((state: State) => {
		const map = state[mapControllerName] as MapState | undefined;
		return map?.layers ? selectVisible(map) : false;
	});

	const setVisible = useCallback(
		(nextVisible: boolean) => {
			dispatch(
				setLayerVisibility(mapControllerName, layerId, nextVisible),
			);
		},
		[dispatch, mapControllerName, layerId],
	);

	return useMemo(() => [visible, setVisible] as const, [visible, setVisible]);
}

export default useLayerVisibility;
