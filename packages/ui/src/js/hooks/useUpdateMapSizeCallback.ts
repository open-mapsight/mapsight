import type {RefObject} from "react";
import {useCallback} from "react";

import type {Dispatch} from "@reduxjs/toolkit";

import {async} from "@mapsight/core/lib/base/actions";
import {updateMapSize} from "@mapsight/core/lib/map/actions";

import {MAP} from "../config/constants/controllers";
import type {MainPanelPosition} from "../types";

export default function useUpdateMapSizeCallback(
	// TODO: use hook
	dispatch: Dispatch,
	// TODO: why is this a ref?
	positionRef?: RefObject<MainPanelPosition | null>,
	reCenter: boolean = true,
) {
	return useCallback(
		function updateMapSizeCallback() {
			dispatch(
				async(
					updateMapSize(MAP, {
						from: positionRef?.current,
						reCenter,
					}),
				),
			);
		},
		[dispatch, positionRef, reCenter],
	);
}
