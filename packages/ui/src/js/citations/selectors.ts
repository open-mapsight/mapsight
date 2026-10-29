import {createSelector} from "@reduxjs/toolkit";

import type {FeatureSourcesState} from "@mapsight/core/lib/feature-sources/types";
import type {ListState} from "@mapsight/core/lib/list/types";
import type {MapState} from "@mapsight/core/lib/map/types";

import {
	FEATURE_LIST,
	FEATURE_SOURCES,
	MAP,
} from "../config/constants/controllers";
import type {RootStateSlice} from "../store/selectors";
import {collectCitationIconIds} from "./collect-icon-ids";

export const citationIconIdsFromStateSelector = createSelector(
	(state: RootStateSlice) =>
		(state[MAP] as MapState | undefined)?.visibleLayers,
	(state: RootStateSlice) => (state[MAP] as MapState | undefined)?.layers,
	(state: RootStateSlice) =>
		(state[FEATURE_LIST] as ListState | undefined)?.featureSource,
	(state: RootStateSlice) =>
		state[FEATURE_SOURCES] as FeatureSourcesState | undefined,
	(state: RootStateSlice) => state.app.searchResult?.data?.features,
	(
		visibleLayerIds,
		layers,
		listFeatureSourceId,
		featureSources,
		searchResultFeatures,
	) =>
		collectCitationIconIds({
			visibleLayerIds,
			layers,
			listFeatureSourceId,
			featureSources,
			searchResultFeatures: searchResultFeatures?.filter(
				(feature): feature is NonNullable<typeof feature> =>
					feature != null,
			),
		}),
);
