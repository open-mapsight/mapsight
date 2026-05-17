import type {RefObject} from "react";
import {useEffect, useRef} from "react";
import {useDispatch} from "react-redux";

import {setViewportAnchor} from "@mapsight/core/lib/map/actions";

import {MAP} from "../config/constants/controllers";
import type {MainPanelPosition} from "../types";
import useUpdateMapSizeOnTransitionEnd from "./useUpdateMapSizeOnTransitionEnd";

function useMapsightPanel(
	containerRef: RefObject<Element | null>,
	panelPosition: MainPanelPosition,
	collapsed: boolean,
) {
	const previousPositionRef = useRef<MainPanelPosition | null>(null);
	const previousCollapsedRef = useRef<boolean>(false);
	const dispatch = useDispatch();

	useEffect(() => {
		if (
			previousPositionRef.current &&
			(previousPositionRef.current !== panelPosition ||
				previousCollapsedRef.current !== collapsed)
		) {
			dispatch(setViewportAnchor(MAP, "right"));
		}

		previousPositionRef.current = panelPosition;
		previousCollapsedRef.current = collapsed;
	}, [collapsed, dispatch, panelPosition]);

	useUpdateMapSizeOnTransitionEnd(
		containerRef.current ?? undefined,
		dispatch,
		previousPositionRef,
	);
}

export default useMapsightPanel;
