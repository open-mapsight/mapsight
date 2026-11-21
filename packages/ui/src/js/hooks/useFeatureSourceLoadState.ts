import {useSelector} from "react-redux";

import {
	type FeatureSourceLoadState,
	getFeatureSourceLoadState,
} from "@mapsight/core/lib/feature-sources/load-state";
import type {FeatureSourcesState} from "@mapsight/core/lib/feature-sources/types";

import {FEATURE_SOURCES} from "../config/constants/controllers";

/**
 * Load state of one feature source: `missing`, `idle`, `loading`, `ok` or
 * `error`. See `getFeatureSourceLoadState` for the exact rules. The component
 * re-renders only when the state itself changes, not on every data update.
 */
export default function useFeatureSourceLoadState(
	id: string,
	controllerName: string = FEATURE_SOURCES,
): FeatureSourceLoadState {
	return useSelector((state: Record<string, unknown>) => {
		const sources = state[controllerName] as
			FeatureSourcesState | undefined;
		return getFeatureSourceLoadState(
			sources && Object.hasOwn(sources, id) ? sources[id] : undefined,
		);
	});
}
