import {useSelector} from "react-redux";

import {viewSelector} from "@mapsight/core/lib/map/selectors";
import type {MapState, MapViewState} from "@mapsight/core/lib/map/types";
import type {State} from "@mapsight/core/types";

import {MAP} from "../config/constants/controllers";

/**
 * Subscribes to the view state of a map (`center`, `zoom`, `resolution`,
 * `rotation`). `undefined` until the map has view state.
 *
 * @param mapControllerName Map controller name. @default `"map"`
 */
function useMapView(mapControllerName: string = MAP): MapViewState | undefined {
	return useSelector((state: State) => {
		const mapState = state[mapControllerName] as MapState | undefined;
		return mapState && viewSelector(mapState);
	});
}

export default useMapView;
