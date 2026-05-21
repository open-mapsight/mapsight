import type {RefObject} from "react";
import {useEffect} from "react";

import type {Dispatch} from "@reduxjs/toolkit";

import type {MainPanelPosition} from "../types";
import useUpdateMapSizeCallback from "./useUpdateMapSizeCallback";

export default function useUpdateMapSizeOnTransitionEnd(
	target: undefined | Element,
	// TODO: use hook
	dispatch: Dispatch,
	// TODO: why is this a ref?
	positionRef?: RefObject<MainPanelPosition | null>,
	reCenter: boolean = true,
) {
	const updateMapSize = useUpdateMapSizeCallback(
		dispatch,
		positionRef,
		reCenter,
	);

	useEffect(() => {
		if (target === undefined) {
			return;
		}

		const handleTransitionEnd = (e: Event) => {
			if (e.target === target) {
				console.log("UPDATE MAP SIZE ON TRANSITION END");
				updateMapSize();
			}
		};

		target.addEventListener("transitionend", handleTransitionEnd);
		return () => {
			target.removeEventListener("transitionend", handleTransitionEnd);
		};
	}, [target, updateMapSize]);
}
