import {useMemo} from "react";
import {useSelector} from "react-redux";

import {
	getFeatureSourceError,
	getFeatureSourceStatus,
} from "@mapsight/core/lib/feature-sources/selectors";
import type {FeatureSourceState} from "@mapsight/core/lib/feature-sources/types";

import {FEATURE_LIST} from "../../../config/constants/controllers";
import {
	lastListScrollPositionSelector,
	layerSwitcherShowExternalSelector,
	tagSwitcherShowSelector,
} from "../../../store/selectors";
import type {FullUiState} from "../../../types";
import useFeatureListFeatureSource from "./useFeatureListFeatureSource";
import type {PaginatedFilteredFeaturesState} from "./usePaginatedFilteredFeatures";
import usePaginatedFilteredFeatures from "./usePaginatedFilteredFeatures";

export type FeatureListStateProps = PaginatedFilteredFeaturesState & {
	tagSwitcherShow: FullUiState["tagSwitcher"]["show"];
	layerSwitcherShowExternal: FullUiState["layerSwitcher"]["show"]["external"];
	status: string | null;
	error: string | null;
	featureSourceId?: string;
	featureSource?: FeatureSourceState;
	scrollPosition: number | null;
};

export default function useFeatureListState(
	listUiOptions: FullUiState["list"],
	sort = true,
	filter = true,
	enableScrollPosition = true,
	listControllerName = FEATURE_LIST,
) {
	const {featureSourceId, featureSource} =
		useFeatureListFeatureSource(listControllerName);
	const tagSwitcherShow = useSelector(tagSwitcherShowSelector);
	const layerSwitcherShowExternal = useSelector(
		layerSwitcherShowExternalSelector,
	);
	const scrollPosition = useSelector(lastListScrollPositionSelector);

	const paginatedFilteredFeaturesState = usePaginatedFilteredFeatures(
		featureSource,
		featureSourceId,
		listUiOptions,
		sort,
		filter,
	);
	const featureSourceState = useMemo(
		() => ({
			status: featureSource
				? getFeatureSourceStatus(featureSource)
				: null,
			error: featureSource
				? (getFeatureSourceError(featureSource) as string | null)
				: null,
		}),
		[featureSource],
	);

	return useMemo(
		(): FeatureListStateProps => ({
			...paginatedFilteredFeaturesState,
			...featureSourceState,
			tagSwitcherShow: !!tagSwitcherShow,
			layerSwitcherShowExternal: !!layerSwitcherShowExternal,
			featureSourceId,
			featureSource,
			scrollPosition:
				(enableScrollPosition ? scrollPosition : null) ?? null,
		}),
		[
			paginatedFilteredFeaturesState,
			featureSourceState,
			tagSwitcherShow,
			layerSwitcherShowExternal,
			featureSourceId,
			featureSource,
			enableScrollPosition,
			scrollPosition,
		],
	);
}
