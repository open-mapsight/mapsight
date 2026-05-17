import {useMemo} from "react";
import {useSelector} from "react-redux";

import type {FeatureSelectionState} from "@mapsight/core/lib/feature-selections/selectors";
import {
	getFeatureSourceError,
	getFeatureSourceStatus,
} from "@mapsight/core/lib/feature-sources/selectors";

import {FEATURE_LIST} from "../../../config/constants/controllers";
import {featureListContextSelector} from "../../../store/selectors";
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
	scrollPosition: number | null;
	selectSelection: undefined | FeatureSelectionState;
	preselectSelection: undefined | FeatureSelectionState;
	highlightSelection: undefined | FeatureSelectionState;
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
	const {
		tagSwitcherShow,
		layerSwitcherShowExternal,
		scrollPosition,
		selectSelection,
		preselectSelection,
		highlightSelection,
	} = useSelector(featureListContextSelector);
	const paginatedFilteredFeaturesState = usePaginatedFilteredFeatures(
		featureSource,
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
			scrollPosition:
				(enableScrollPosition ? scrollPosition : null) ?? null,
			selectSelection,
			preselectSelection,
			highlightSelection,
		}),
		[
			paginatedFilteredFeaturesState,
			featureSourceState,
			tagSwitcherShow,
			layerSwitcherShowExternal,
			featureSourceId,
			enableScrollPosition,
			scrollPosition,
			selectSelection,
			preselectSelection,
			highlightSelection,
		],
	);
}
