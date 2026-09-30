import type {Selector} from "@reduxjs/toolkit";
import {createSelector} from "@reduxjs/toolkit";

import type {
	FeatureSourceState,
	FeatureSourcesState,
} from "@mapsight/core/lib/feature-sources/types";
import type {State} from "@mapsight/core/types";

import {FEATURE_SOURCES} from "../../config/constants/controllers";

const EMPTY_MEMBER_SOURCES: Array<FeatureSourceState | undefined> = [];

/**
 * Resolves member feature sources for a combined list source.
 * Returns a stable empty array / undefined so useSelector does not re-render
 * on unrelated store updates.
 */
export const combinedMemberSourcesSelector: Selector<
	State,
	Array<FeatureSourceState | undefined> | undefined,
	[FeatureSourceState | undefined]
> = createSelector(
	[
		(state: State) =>
			state[FEATURE_SOURCES] as FeatureSourcesState | undefined,
		(_state: State, featureSource: FeatureSourceState | undefined) =>
			featureSource,
	],
	(sources, featureSource) => {
		if (featureSource?.type !== "combined") {
			return undefined;
		}

		const names = featureSource.featureSourceNames ?? [];
		if (!names.length) {
			return EMPTY_MEMBER_SOURCES;
		}

		return names.map((name) => sources?.[name]);
	},
);
