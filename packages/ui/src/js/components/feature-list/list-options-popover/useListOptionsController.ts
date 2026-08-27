import {useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";

import {getAllFeatures} from "@mapsight/core/lib/feature-sources/selectors";
import type {FeatureSourcesState} from "@mapsight/core/lib/feature-sources/types";
import {featureSourceIdSelector} from "@mapsight/core/lib/list/selectors";
import type {ListState} from "@mapsight/core/lib/list/types";
import {getGeolocation} from "@mapsight/core/lib/user-geolocation/actions";
import {
	type UserGeolocationState,
	geolocationStatusSelector,
} from "@mapsight/core/lib/user-geolocation/selectors";
import type {State} from "@mapsight/core/types";

import {
	FEATURE_LIST,
	FEATURE_SOURCES,
	TAG_FILTER,
	USER_GEOLOCATION,
} from "../../../config/constants/controllers";
import {
	filterListQuery,
	hideTagAndTagGroup,
	sortList,
} from "../../../store/actions";
import {
	type RootStateSlice,
	effectiveListSortingSelector,
	listQuerySelector,
	listSortingSelector,
	placesSelector,
} from "../../../store/selectors";
import {useFeatureListContext} from "../context";

/** UI app slice + core controllers the list options popover reads. */
type ListOptionsState = State &
	RootStateSlice &
	Record<typeof FEATURE_SOURCES, FeatureSourcesState> &
	Record<typeof FEATURE_LIST, ListState> &
	Record<typeof USER_GEOLOCATION, UserGeolocationState>;

function hasActiveTagFilter(state: RootStateSlice) {
	const featureSourceId =
		state.app.tagSwitcher?.featureSourceId ??
		state.app.tagFilter?.featureSourceId;
	const visibleTagGroups = state[TAG_FILTER]?.visibleTagGroups;
	const visibleTags = state[TAG_FILTER]?.visibleTags;

	const tagGroups = featureSourceId
		? visibleTagGroups?.[featureSourceId]
		: undefined;
	if (tagGroups && Object.values(tagGroups).some(Boolean)) {
		return true;
	}

	const tagFilters = featureSourceId
		? visibleTags?.[featureSourceId]
		: undefined;
	if (tagFilters) {
		return Object.values(tagFilters).some((group) =>
			Object.values(group).some(Boolean),
		);
	}

	return (
		Object.values(visibleTagGroups ?? {}).some((groups) =>
			Object.values(groups).some(Boolean),
		) ||
		Object.values(visibleTags ?? {}).some((source) =>
			Object.values(source).some((group) =>
				Object.values(group).some(Boolean),
			),
		)
	);
}

function rawFeatureCountSelector(state: ListOptionsState) {
	const featureSourceId =
		state.app.tagSwitcher?.featureSourceId ??
		state.app.tagFilter?.featureSourceId ??
		featureSourceIdSelector(state[FEATURE_LIST]);

	if (!featureSourceId) {
		return 0;
	}

	const featureSource = state[FEATURE_SOURCES]?.[featureSourceId];
	return featureSource ? getAllFeatures(featureSource).length : 0;
}

/**
 * Adapter over Mapsight list / filter / sort Redux for
 * {@link FeatureListOptionsPopover}.
 */
export default function useListOptionsController() {
	const dispatch = useDispatch();
	const {
		state: {features, featureCount},
	} = useFeatureListContext();

	const featureSourceId = useSelector((state: ListOptionsState) =>
		featureSourceIdSelector(state[FEATURE_LIST]),
	);
	const sorting = useSelector((state: RootStateSlice) =>
		effectiveListSortingSelector(state, featureSourceId),
	);
	const customSorting = useSelector(listSortingSelector);
	const query = useSelector(listQuerySelector);
	const tagFilterActive = useSelector(hasActiveTagFilter);
	const rawFeatureCount = useSelector(rawFeatureCountSelector);
	const places = useSelector(placesSelector);
	const geolocationStatus = useSelector((state: ListOptionsState) =>
		geolocationStatusSelector(state[USER_GEOLOCATION]),
	);

	const activeFilterCount =
		(query?.trim() ? 1 : 0) + (tagFilterActive ? 1 : 0);
	const canResetOptions =
		activeFilterCount > 0 ||
		(customSorting !== undefined && customSorting !== "");
	const totalFeatureCount = rawFeatureCount || features.length;

	const setSorting = useCallback(
		(nextSorting: string) => {
			if (nextSorting === "geolocation") {
				dispatch(getGeolocation() as never);
			}
			dispatch(sortList(nextSorting) as never);
		},
		[dispatch],
	);

	const reset = useCallback(() => {
		dispatch(sortList("") as never);
		dispatch(hideTagAndTagGroup() as never);
		dispatch(filterListQuery(null) as never);
	}, [dispatch]);

	return {
		featureCount,
		totalFeatureCount,
		sorting: sorting || "",
		places,
		geolocationStatus,
		activeFilterCount,
		canResetOptions,
		hasCustomSorting: customSorting !== undefined && customSorting !== "",
		setSorting,
		reset,
	};
}
