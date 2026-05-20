import {useEffect} from "react";

import type {Store} from "@reduxjs/toolkit";

import {updateMapSize} from "@mapsight/core/lib/map/actions";

import identity from "@mapsight/lib-js/util/identity";

import {VIEW_MAP_ONLY, VIEW_MOBILE} from "../config/constants/app";
import {MAP} from "../config/constants/controllers";
import type {MapsightUiView} from "../types";
import usePrevious from "./usePrevious";

export default function useUpdateMapSizeOnViewChange(
	// TODO: use hook
	view: MapsightUiView,
	// TODO: use hook
	store: Store,
) {
	const prevView = usePrevious(view);

	useEffect(() => {
		const didViewChangeBetweenMobileAndMapOnly =
			(prevView === VIEW_MOBILE && view === VIEW_MAP_ONLY) ||
			(view === VIEW_MOBILE && prevView === VIEW_MAP_ONLY);
		const options = didViewChangeBetweenMobileAndMapOnly
			? identity<Parameters<typeof updateMapSize>[1]>({
					from: "below",
					to: "below",
					reCenter: false,
				})
			: undefined;

		store.dispatch(updateMapSize(MAP, options));
	}, [prevView, view, store]);
}
