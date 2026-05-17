import {createSelector, createStructuredSelector} from "reselect";

import type {
	FeatureSelectionId,
	FeatureSelectionsState,
} from "@mapsight/core/lib/feature-selections/selectors";
import {
	createFeatureSelectionSelector,
	getFilteredFeatures,
} from "@mapsight/core/lib/feature-selections/selectors";
import {
	createTagsWithCountFromFeatureSourceSelector,
	findFeatureInFeatureSourcesById,
	mapFeaturesToFeatureSource,
} from "@mapsight/core/lib/feature-sources/selectors";
import type {FeatureSourcesState} from "@mapsight/core/lib/feature-sources/types";
import {
	createListFeatureSelector,
	featureSourceIdSelector,
} from "@mapsight/core/lib/list/selectors";
import type {ListState} from "@mapsight/core/lib/list/types";
import {visibleLayersWithMiniLegendsSelector} from "@mapsight/core/lib/map/selectors";
import type {MapState} from "@mapsight/core/lib/map/types";
import type {UserGeolocationState} from "@mapsight/core/lib/user-geolocation/selectors";
import type {State} from "@mapsight/core/types";

import getPath from "@mapsight/lib-js/object/getPath";

import type {MapsightUiPlacesData} from "../components/feature-list-sorting/feature-list-sorting.tsx";
import type {View} from "../config/constants/app";
import {
	DETAILS_CONTENT_STATE_KEY,
	VIEW_FULLSCREEN,
	VIEW_MAP_ONLY,
	VIEW_MOBILE,
} from "../config/constants/app";
import {
	FEATURE_LIST,
	FEATURE_SELECTIONS,
	FEATURE_SOURCES,
	MAP,
	TAG_FILTER,
	USER_GEOLOCATION,
} from "../config/constants/controllers";
import {
	FEATURE_SELECTION_HIGHLIGHT,
	FEATURE_SELECTION_PRESELECT,
	FEATURE_SELECTION_SELECT,
} from "../config/feature/selections";
import type {
	FullUiState,
	MainPanelContentType,
	MainPanelContextOptions,
	MapsightUiFeature,
	UiState,
} from "../types.ts";
import {
	FETCH_JSON_STATUS_ERROR,
	FETCH_JSON_STATUS_LOADING,
	FETCH_JSON_STATUS_SUCCESS,
	FETCH_TEXT_STATUS_ERROR,
	FETCH_TEXT_STATUS_SUCCESS,
} from "./actions.ts";

export const SEARCH_STATUS_INACTIVE = "inactive";
export const SEARCH_STATUS_EMPTY = "empty";
export const SEARCH_STATUS_FOUND = "found";
export const SEARCH_STATUS_LOADING = "loading";
export const SEARCH_STATUS_ERROR = "error";

type RootStateSlice = {
	app: UiState;
};

export const viewSelector = (state: RootStateSlice) => state.app.view!;

export const isViewFullscreen = (view: View) => view === VIEW_FULLSCREEN;

/**
 * returns `true` if view is "mobile" or "mapOnly"
 */
export const isViewMobile = (view: View | undefined) =>
	view === VIEW_MOBILE || view === VIEW_MAP_ONLY;

export const isViewMapOnly = (view: View) => view === VIEW_MAP_ONLY;

export const isViewMobileOrMapOnlySelector = createSelector(
	viewSelector,
	isViewMobile,
);
export const isViewMapOnlySelector = createSelector(
	viewSelector,
	isViewMapOnly,
);
export const isFullscreenSelector = createSelector(
	viewSelector,
	isViewFullscreen,
);

export const mapVisible = (state: RootStateSlice) => state.app.map?.show;
export const listVisible = (state: RootStateSlice) => state.app.list?.show;
export const timeFilterVisible = (state: RootStateSlice) =>
	state.app.timeFilter?.show;

export const mapAndListVisible = createSelector(
	[mapVisible, listVisible],
	(map, list) => map && list,
);

export const viewBreakpointsSelector = (state: RootStateSlice) =>
	state.app.viewBreakpoints;

export const titleSelector = (state: RootStateSlice) => state.app.title;
export const isMapOutOfViewportSelector = (state: RootStateSlice) =>
	state.app.mapIsOutOfViewport;

export const regionsSelector = (state: RootStateSlice) => state.app.regions;

export const placesSelector = (state: RootStateSlice): MapsightUiPlacesData =>
	state.app.places as MapsightUiPlacesData;

export const lastListScrollPositionSelector = (state: RootStateSlice) =>
	state.app.lastListScrollPosition;
export const listSortingSelector = (state: RootStateSlice) =>
	state.app.listSorting;
export const listQuerySelector = (state: RootStateSlice) => state.app.listQuery;
export const listPageSelector = (state: RootStateSlice) =>
	state.app.listPage || 0;
export const listFilterOptionsSelector = createStructuredSelector({
	query: listQuerySelector,
	sorting: listSortingSelector,
	places: createSelector(
		[
			(state: State) => state[USER_GEOLOCATION] as UserGeolocationState,
			placesSelector,
		],
		(userGeolocation, places): MapsightUiPlacesData => {
			return userGeolocation.longitude && userGeolocation.latitude
				? {
						...places,
						geolocation: {
							title: "",
							x: userGeolocation.longitude,
							y: userGeolocation.latitude,
						},
					}
				: places
					? places
					: {};
		},
	),
});

export const searchQuerySelector = (state: RootStateSlice) =>
	state.app.searchQuery;
export const searchResultSelector = (state: RootStateSlice) =>
	getPath(state, ["app", "searchResult"]);
export const getSearchResultStatus = (
	searchResult?: FullUiState["searchResult"],
) => searchResult?.status;
export const getSearchResultFeatures = (
	searchResult?: FullUiState["searchResult"],
) => getPath(searchResult, ["data", "features"], []) as MapsightUiFeature[];
export const searchResultFeaturesSelector = createSelector(
	searchResultSelector,
	getSearchResultFeatures,
);

export const haveSearchInMapSelector = (state: RootStateSlice) =>
	state.app.searchInMap;
export const isEmbeddedMapSelector = (state: RootStateSlice) =>
	state.app.embeddedMap;

export const listUiOptionsSelector = (state: RootStateSlice) =>
	state.app.list || {};
export const listUiOptionDetailsSelector = (state: RootStateSlice) =>
	state.app.list?.detailsInList;
export const listUiOptionIntegratedSelector = (state: RootStateSlice) =>
	state.app.list?.integratedList;
export const listUiOptionSelectedOnlySelector = (state: RootStateSlice) =>
	state.app.list?.showSelectedOnly;

export const listUiOptionSelectionBehaviorSelector = (state: RootStateSlice) =>
	state.app.list?.selectionBehavior || {};

export const listUiScrollToItemOnPreselectSelector = (state: RootStateSlice) =>
	state.app.list?.scrollToItemOnPreselect === true;

export const listUiOptionSelectionSelectionSelector = (state: RootStateSlice) =>
	state.app.list?.selectionBehaviorSelection || FEATURE_SELECTION_SELECT;
export const listUiOptionsShowVaryingInfoOnlySelector = (
	state: RootStateSlice,
) => state.app.list?.showVaryingListInfoOnly;

export const layerSwitcherShowInternalSelector = (state: RootStateSlice) =>
	state.app.layerSwitcher?.show?.internal;
export const layerSwitcherShowExternalSelector = (state: RootStateSlice) =>
	state.app.layerSwitcher?.show?.external;
export const layerSwitcherConfigInternalSelector = (state: RootStateSlice) =>
	state.app.layerSwitcher?.internal;
export const layerSwitcherConfigExternalSelector = (state: RootStateSlice) =>
	state.app.layerSwitcher?.external;

export const pageTitleShowSelector = (state: RootStateSlice) =>
	state.app.pageTitle?.show;

export const tagSwitcherShowSelector = (state: RootStateSlice) =>
	state.app.tagSwitcher?.show;
export const tagSwitcherToggleableGroups = (state: RootStateSlice) =>
	state.app.tagSwitcher?.toggleableGroups;
export const tagSwitcherSortTags = (state: RootStateSlice) =>
	state.app.tagSwitcher?.sortTags;
export const tagSwitcherFeatureSourceIdSelector = (state: RootStateSlice) =>
	state.app.tagSwitcher?.featureSourceId;
export const tagSwitcherFeatureSourcesControllerNameSelector = (
	state: RootStateSlice,
) => state.app.tagSwitcher?.featureSourcesControllerName;
export const tagSwitcherTagsSelector = (state: RootStateSlice) => {
	const controllerName =
		tagSwitcherFeatureSourcesControllerNameSelector(state);
	const featureSourceId = tagSwitcherFeatureSourceIdSelector(state);
	if (!controllerName || !featureSourceId) {
		return {};
	}

	return createTagsWithCountFromFeatureSourceSelector(
		controllerName,
		featureSourceId,
	)(state);
};

export const viewToggleShowSelector = (state: RootStateSlice) =>
	state.app.viewToggle?.show;
export const viewToggleOptionsSelector = (state: RootStateSlice) =>
	state.app.viewToggle;

export const searchStatusSelector = createSelector(
	searchResultSelector,
	searchQuerySelector,
	createSelector(
		getSearchResultStatus,
		getSearchResultFeatures,
		(_, query) => !!query,
		(status, features: MapsightUiFeature[], hasQuery: boolean) => {
			switch (status) {
				case FETCH_JSON_STATUS_ERROR:
					return SEARCH_STATUS_ERROR;
				case FETCH_JSON_STATUS_LOADING:
					return SEARCH_STATUS_LOADING;
				case FETCH_JSON_STATUS_SUCCESS:
					return hasQuery
						? features.length
							? SEARCH_STATUS_FOUND
							: SEARCH_STATUS_EMPTY
						: SEARCH_STATUS_INACTIVE;
			}
		},
	),
);
export const userPreferenceListVisibleSelector = (state: RootStateSlice) =>
	state.app.userPreferenceListVisible;

export const searchResultSelectionFeaturesSelector = (state: RootStateSlice) =>
	state.app.searchResultSelectionFeatures;
export const searchResultSelectionFeatureSourceSelector = createSelector(
	searchResultSelectionFeaturesSelector,
	mapFeaturesToFeatureSource<MapsightUiFeature>,
);

export const featureDetailsSelector = (state: RootStateSlice) =>
	state.app[DETAILS_CONTENT_STATE_KEY];
export const featureDetailsUrlSelector = (state: RootStateSlice) =>
	state.app[DETAILS_CONTENT_STATE_KEY]?.url;

export const featureDetailsHasErrorSelector = createSelector(
	featureDetailsSelector,
	(detailsContent) =>
		detailsContent && detailsContent.status === FETCH_TEXT_STATUS_ERROR,
);

export const featureDetailsHtmlSelector = createSelector(
	featureDetailsSelector,
	(detailsContent) =>
		detailsContent?.status === FETCH_TEXT_STATUS_SUCCESS
			? detailsContent.data
			: null,
);

export const createTagVisibleSelector =
	(featureSourceId, tagGroup, tag) => (state) =>
		!!getPath(state, [
			TAG_FILTER,
			"visibleTags",
			featureSourceId,
			tagGroup,
			tag,
		]);

export const createTagGroupVisibleSelector =
	(featureSourceId, tagGroup) => (state) =>
		!!getPath(state, [
			TAG_FILTER,
			"visibleTagGroups",
			featureSourceId,
			tagGroup,
		]);

export const isOverlayModalVisibleSelector = (state: RootStateSlice) =>
	state.app.isOverlayModalVisible === true;

export const selectedRegionIdSelector = (state: RootStateSlice) =>
	state.app.selectedRegion || null;

export const selectedRegionSelector = createSelector(
	selectedRegionIdSelector,
	regionsSelector,
	(id, regions) => (id && regions && regions[id]) || null,
);

export const miniLegendLayerIdSelector = createSelector(
	(state: State) =>
		visibleLayersWithMiniLegendsSelector(state[MAP] as MapState),
	(state: RootStateSlice) => state.app.miniLegendLayer,
	(visibleLayers, layerId) => {
		// no layers visible => return early
		if (!visibleLayers) {
			return null;
		}

		const visibleLayerIds = Object.keys(visibleLayers);

		// layer is defined and visible?
		if (layerId && visibleLayerIds.includes(layerId)) {
			return layerId;
		}

		// otherwise, default to first visible layer
		return visibleLayerIds[0] || null;
	},
);

export const selectedFeatureSelector = createSelector(
	(state: State) =>
		(state[FEATURE_SELECTIONS] as FeatureSelectionsState)[
			FEATURE_SELECTION_SELECT
		],
	(state: State) => state[FEATURE_SOURCES] as FeatureSourcesState,
	function getFeature(featureSelection, featureSources) {
		const features = getFilteredFeatures(featureSelection);
		const featureId = features && features[0];
		return featureId
			? findFeatureInFeatureSourcesById(featureSources, featureId)
			: null;
	},
);

export const createMainPanelContentTypeSelector = (
	options: Pick<
		MainPanelContextOptions,
		"showSelectionInfo" | "showList" | "collapsible"
	>,
) =>
	createSelector(
		selectedFeatureSelector,
		userPreferenceListVisibleSelector,
		function getMainPanelState(feature, userPreferenceListVisible) {
			const {showSelectionInfo, showList, collapsible} = options;

			let contentType: MainPanelContentType = null;
			if (showSelectionInfo && feature) {
				contentType = "selectionInfo";
			} else if (showList) {
				contentType = "list";
			}

			return {
				feature: feature,
				contentType: contentType,
				collapsed:
					contentType === null ||
					(contentType === "list" &&
						collapsible &&
						!userPreferenceListVisible),
			};
		},
	);

export function createSelectionIndexSelector(
	featureIds: Array<string>,
	targetSelection: FeatureSelectionId,
) {
	return createSelector(
		(state: State) =>
			(state[FEATURE_SELECTIONS] as FeatureSelectionsState)[
				targetSelection
			]?.features,
		(selection) =>
			featureIds?.length && selection?.length
				? featureIds.indexOf(selection[0]!)
				: -1,
	);
}

export const featureSelectionInfoUiOptionsSelector = (state: RootStateSlice) =>
	state.app.featureSelectionInfo || {};
export const featureSelectionInfoStickyHeaderSelector = createSelector(
	featureSelectionInfoUiOptionsSelector,
	({stickyHeader}) => stickyHeader,
);
export const featureSelectionInfoStuckHeaderHeightSelector = createSelector(
	featureSelectionInfoUiOptionsSelector,
	({stuckHeaderHeight}) => stuckHeaderHeight,
);

const selectSelectionSelector = createFeatureSelectionSelector(
	FEATURE_SELECTIONS,
	FEATURE_SELECTION_SELECT,
);
const preselectSelectionSelector = createFeatureSelectionSelector(
	FEATURE_SELECTIONS,
	FEATURE_SELECTION_PRESELECT,
);
const highlightSelectionSelector = createFeatureSelectionSelector(
	FEATURE_SELECTIONS,
	FEATURE_SELECTION_HIGHLIGHT,
);

export const featureListContextSelector = createStructuredSelector({
	tagSwitcherShow: tagSwitcherShowSelector,
	layerSwitcherShowExternal: layerSwitcherShowExternalSelector,
	scrollPosition: lastListScrollPositionSelector,
	selectSelection: selectSelectionSelector,
	preselectSelection: preselectSelectionSelector,
	highlightSelection: highlightSelectionSelector,
});

export const createFeatureSourceSelector = (
	listControllerName = FEATURE_LIST,
) =>
	createStructuredSelector({
		featureSourceId: createSelector(
			(state: State) => state[listControllerName] as ListState,
			featureSourceIdSelector,
		),
		featureSource: createListFeatureSelector(
			listControllerName,
			FEATURE_SOURCES,
		),
	});
