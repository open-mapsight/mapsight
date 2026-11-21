import {useCallback, useMemo} from "react";
import {useDispatch, useSelector} from "react-redux";

import {animate} from "@mapsight/core/lib/map/actions";
import {viewZoomSelector} from "@mapsight/core/lib/map/selectors";
import type {MapState} from "@mapsight/core/lib/map/types";
import type {State} from "@mapsight/core/types";

import {MAP} from "../config/constants/controllers";

const ZOOM_ANIMATION_DURATION = 200;

export type UseMapZoomResult = {
	/** Rounded zoom level; `undefined` until the map has view state. */
	zoom: number | undefined;
	/** Animates to one zoom level closer. */
	zoomIn: () => void;
	/** Animates to one zoom level further away. */
	zoomOut: () => void;
};

/**
 * Zoom level of a map and the same animated zoom steps as the zoom buttons.
 *
 * @param mapControllerName Map controller name. @default `"map"`
 */
function useMapZoom(mapControllerName: string = MAP): UseMapZoomResult {
	const dispatch = useDispatch();
	const zoom = useSelector((state: State) => {
		const mapState = state[mapControllerName] as MapState | undefined;
		return mapState && viewZoomSelector(mapState);
	});

	const zoomIn = useCallback(() => {
		dispatch(
			animate(mapControllerName, {
				zoom: (zoom ?? 0) + 1,
				duration: ZOOM_ANIMATION_DURATION,
			}),
		);
	}, [dispatch, mapControllerName, zoom]);

	const zoomOut = useCallback(() => {
		dispatch(
			animate(mapControllerName, {
				zoom: (zoom ?? 0) - 1,
				duration: ZOOM_ANIMATION_DURATION,
			}),
		);
	}, [dispatch, mapControllerName, zoom]);

	return useMemo(() => ({zoom, zoomIn, zoomOut}), [zoom, zoomIn, zoomOut]);
}

export default useMapZoom;
