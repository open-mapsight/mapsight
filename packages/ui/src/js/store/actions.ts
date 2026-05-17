// TODO: Replace with generic tracking solution that does not rely on simplejs to be used globally
import {easeOut} from "ol/easing";
import type {Extent} from "ol/extent";

import {batchActions} from "redux-batched-actions";

import {mergeAll} from "@mapsight/core/lib/base/actions";
import {deselectAll} from "@mapsight/core/lib/feature-selections/actions";
import {animate as animateMap} from "@mapsight/core/lib/map/actions";
import type {ActionOrThunk, State, ThunkAction} from "@mapsight/core/types";

import {trackSiteSearch} from "@mapsight/lib-js/misc/piwik";
import updateQueryStringParameter from "@mapsight/lib-js/string/update-query-string-parameter";

import {siteConfig} from "../config";
import type {View} from "../config/constants/app";
import {DETAILS_CONTENT_STATE_KEY} from "../config/constants/app";
import * as c from "../config/constants/controllers";
import {
	FEATURE_SELECTION_HIGHLIGHT,
	FEATURE_SELECTION_PRESELECT,
	FEATURE_SELECTION_SELECT,
} from "../config/feature/selections";
import type {FullUiState, MapsightUiFeatureId, UiState} from "../types.ts";
import {featureDetailsUrlSelector, regionsSelector} from "./selectors";

function ensureFullUrl(url: string) {
	let requestUrl = url.trim();
	if (typeof window === "undefined" && requestUrl.startsWith("/")) {
		requestUrl = siteConfig.baseUrl.replace(/\/*$/, "") + requestUrl;
	}
	return requestUrl;
}

export function resetMapsightCore(config: Partial<State>) {
	return batchActions([
		deselectAll(c.FEATURE_SELECTIONS, FEATURE_SELECTION_HIGHLIGHT),
		deselectAll(c.FEATURE_SELECTIONS, FEATURE_SELECTION_PRESELECT),
		deselectAll(c.FEATURE_SELECTIONS, FEATURE_SELECTION_SELECT),
		mergeAll(config),
	]);
}

export const SET_VIEW = "SET_VIEW";

export function setView(value: View) {
	return {
		type: SET_VIEW,
		value: value,
	};
}

export const SET_LIST_VISIBLE = "SET_LIST_VISIBLE";

export function setListVisible(value: boolean) {
	return {
		type: SET_LIST_VISIBLE,
		value: value,
	};
}

export const SET_USER_PREFERENCE_LIST_VISIBLE = "SET_LIST_IS_VISIBLE";

// Das setzt die User-Preferenz für die Listenspalte in Fullscreen
// es gibt noch state[FEATURE_LIST][visible], die die Sicherbarkeit der Liste an sich steuert
export function setListPreferVisible(value: boolean) {
	return {
		type: SET_USER_PREFERENCE_LIST_VISIBLE,
		value: value,
	};
}

export const SET_LIST_SCROLL_ON_PRESELECTION =
	"SET_LIST_SCROLL_ON_PRESELECTION";

export function setListScrollOnPreselection(value: boolean) {
	return {
		type: SET_LIST_SCROLL_ON_PRESELECTION,
		value: value,
	};
}

export const SET_LIST_SELECTION_BEHAVIOR = "SET_LIST_SELECTION_BEHAVIOR";

export function setListSelectionBehavior(
	value: Partial<FullUiState["list"]["selectionBehavior"]>,
) {
	return {
		type: SET_LIST_SELECTION_BEHAVIOR,
		value: value,
	};
}

export const SET_LIST_SELECTION_BEHAVIOR_SELECTION =
	"SET_LIST_SELECTION_BEHAVIOR_SELECTION";

export function setListSelectionBehaviorSelection(
	value: FullUiState["list"]["selectionBehaviorSelection"],
) {
	return {
		type: SET_LIST_SELECTION_BEHAVIOR_SELECTION,
		value: value,
	};
}

export const SET_LIST_SELECT_ON_CLICK = "SET_LIST_SELECT_ON_CLICK";

export function setListSelectOnClick(value: boolean) {
	return {
		type: SET_LIST_SELECT_ON_CLICK,
		value: value,
	};
}

export const SET_LIST_HIGHLIGHT_ON_MOUSE = "SET_LIST_HIGHLIGHT_ON_MOUSE";

export function setListHighlightOnMouse(value: boolean) {
	return {
		type: SET_LIST_HIGHLIGHT_ON_MOUSE,
		value: value,
	};
}

export const SET_LIST_INTEGRATED = "SET_LIST_INTEGRATED";

export function setListIntregrated(integratedList: boolean) {
	return {
		type: SET_LIST_INTEGRATED,
		value: integratedList,
	};
}

export const SET_LIST_FILTER_CONTROL = "SET_LIST_FILTER_CONTROL";

export function setListFilterControl(showFilterControl: boolean) {
	return {
		type: SET_LIST_FILTER_CONTROL,
		value: showFilterControl,
	};
}

export const SET_LIST_SORT_CONTROL = "SET_LIST_SORT_CONTROL";

export function setListSortControl(showSortControl: boolean) {
	return {
		type: SET_LIST_SORT_CONTROL,
		value: showSortControl,
	};
}

export const SET_LIST_CYCLING_CONTROL = "SET_LIST_CYCLING_CONTROL";

export function setListCyclingControl(showCyclingControl: boolean) {
	return {
		type: SET_LIST_CYCLING_CONTROL,
		value: showCyclingControl,
	};
}

export const SET_TIME_FILTER_VISIBLE = "SET_TIME_FILTER_VISIBLE";

export function setTimeFilterVisible(value: boolean) {
	return {
		type: SET_TIME_FILTER_VISIBLE,
		value: value,
	};
}

export const SET_TAG_FILTER_CONTROL = "SET_TAG_FILTER_CONTROL";

export function setTagFilterControl(
	show: boolean,
	featureSourcesControllerName: string,
	featureSourceId: string,
	tagSwitcherOptions?: Omit<
		Partial<FullUiState["tagSwitcher"]>,
		"show" | "featureSourcesControllerName" | "featureSourceId"
	>,
) {
	return {
		type: SET_TAG_FILTER_CONTROL,
		show: show,
		featureSourcesControllerName: featureSourcesControllerName,
		featureSourceId: featureSourceId,
		tagSwitcherOptions: tagSwitcherOptions,
	};
}

export const SET_LIST_PAGINATION_CONTROL = "SET_LIST_PAGINATION_CONTROL";

export function setListPaginationControl(show: boolean) {
	return {
		type: SET_LIST_PAGINATION_CONTROL,
		value: show,
	};
}

export const SET_MAP_VISIBLE = "SET_MAP_VISIBLE";

export function setMapVisible(value: boolean) {
	return {
		type: SET_MAP_VISIBLE,
		value: value,
	};
}

export const SET_MAP_IS_OUT_OF_VIEWPORT = "SET_MAP_IS_OUT_OF_VIEWPORT";

export function setMapIsOutOfViewport(value: boolean) {
	return {
		type: SET_MAP_IS_OUT_OF_VIEWPORT,
		value: value,
	};
}

export const TOGGLE_USER_PREFERENCE_LIST_VISIBLE = "TOGGLE_LIST_IS_VISIBLE";

export function toggleUserPreferenceListVisible() {
	return {type: TOGGLE_USER_PREFERENCE_LIST_VISIBLE};
}

export const SET_PAGE_TITLE_SHOW = "SET_PAGE_TITLE_SHOW";

export function setPageTitleShow(value: boolean) {
	return {
		type: SET_PAGE_TITLE_SHOW,
		value: value,
	};
}

export const SET_APP_TITLE = "SET_APP_TITLE";

export function setAppTitle(value: FullUiState["title"]) {
	return {
		type: SET_APP_TITLE,
		value: value,
	};
}

export const SET_META_TAGS = "SET_META_TAGS";

export function setMetaTags(value: FullUiState["metaTags"]) {
	return {
		type: SET_META_TAGS,
		value: value,
	};
}

export const SET_MINI_LEGEND_LAYER = "SET_MINI_LEGEND_LAYER";

export function setMiniLegendLayer(layerId: string | null) {
	return {
		type: SET_MINI_LEGEND_LAYER,
		value: layerId,
	};
}

export const SET_VIEW_BREAKPOINTS = "SET_VIEW_BREAKPOINTS";

export function setViewBreakpoints(value: FullUiState["viewBreakpoints"]) {
	return {
		type: SET_VIEW_BREAKPOINTS,
		value: value,
	};
}

export const SET_LAST_LIST_SCROLL_POSITION = "SET_LAST_LIST_SCROLL_POSITION";

export function setLastListScrollPosition(
	scrollPosition: FullUiState["lastListScrollPosition"],
) {
	return {
		type: SET_LAST_LIST_SCROLL_POSITION,
		value: scrollPosition,
	};
}

export const FILTER_LIST_QUERY = "FILTER_LIST_QUERY";

export function filterListQuery(query: string | null): ThunkAction {
	return function (dispatch) {
		dispatch({
			type: FILTER_LIST_QUERY,
			query: query || "",
		});

		if (query) {
			trackSiteSearch(query, "FilterList");
		}
	};
}

export const SORT_LIST = "SORT_LIST";

export function sortList(sorting: FullUiState["listSorting"]) {
	return {
		type: SORT_LIST,
		sorting: sorting,
	};
}

export const SET_LIST_ITEMS_PER_PAGE = "SET_LIST_ITEMS_PER_PAGE";

export function setListItemsPerPage(
	itemsPerPage: FullUiState["list"]["itemsPerPage"],
) {
	return {
		type: SET_LIST_ITEMS_PER_PAGE,
		value: itemsPerPage,
	};
}

export const LIST_PAGE_SET = "LIST_PAGE_SET";

export function setListPage(page: FullUiState["listPage"]) {
	return {
		type: LIST_PAGE_SET,
		page: page,
	};
}

export function resetListPage() {
	return {
		type: LIST_PAGE_SET,
		page: 0,
	};
}

export const LIST_PAGE_NEXT = "LIST_PAGE_NEXT";

export function nextListPage() {
	return {type: LIST_PAGE_NEXT};
}

export const LIST_PAGE_PREVIOUS = "LIST_PAGE_PREVIOUS";

export function previousListPage() {
	return {type: LIST_PAGE_PREVIOUS};
}

export const FETCH_TEXT_REQUEST = "FETCH_TEXT_REQUEST";
export const FETCH_TEXT_FAILURE = "FETCH_TEXT_FAILURE";
export const FETCH_TEXT_SUCCESS = "FETCH_TEXT_SUCCESS";
export const FETCH_TEXT_RESET = "FETCH_TEXT_RESET";

export function fetchTextRequest(key: string, url: string) {
	return {
		type: FETCH_TEXT_REQUEST,
		key: key,
		url: url,
	};
}

export function fetchTextFailure(key: string, error: unknown) {
	return {
		type: FETCH_TEXT_FAILURE,
		key: key,
		error: error,
	};
}

export function fetchTextSuccess(key: string, data: unknown) {
	return {
		type: FETCH_TEXT_SUCCESS,
		key: key,
		data: data,
	};
}

export const FETCH_TEXT_STATUS_LOADING = "loading";
export const FETCH_TEXT_STATUS_ERROR = "error";
export const FETCH_TEXT_STATUS_SUCCESS = "success";

export function fetchText(key: string, url: string): ThunkAction {
	return function (dispatch, getState) {
		const selectState = () => (getState().app as UiState)[key] || {};

		// do not fetch again if already running
		const state = selectState();
		if (state.url === url && state.status === FETCH_TEXT_STATUS_LOADING) {
			return;
		}

		dispatch(fetchTextRequest(key, url));

		// TODO: Fix this magic!
		const requestUrl = ensureFullUrl(url);

		// Do not use catch, because that will also catch
		// any errors in the dispatch and resulting render,
		// causing a loop of 'Unexpected batch number' errors.
		// https://github.com/facebook/react/issues/6895
		fetch(requestUrl)
			.then(
				(response) => response.text(),
				(error) => {
					// discard response if url changed
					if (selectState().url !== url) {
						return Promise.reject();
					}

					dispatch(fetchTextFailure(key, error));

					return Promise.reject();
				},
			)
			.then((data) => {
				// discard response if url changed
				if (selectState().url !== url) {
					return;
				}

				dispatch(fetchTextSuccess(key, data));
			})
			.catch((error) => {
				console.error(error);
				dispatch(fetchTextFailure(key, error));
			});
	};
}

export function fetchTextReset(key: string) {
	return {
		type: FETCH_TEXT_RESET,
		key: key,
	};
}

export const FETCH_JSON_REQUEST = "FETCH_JSON_REQUEST";
export const FETCH_JSON_FAILURE = "FETCH_JSON_FAILURE";
export const FETCH_JSON_SUCCESS = "FETCH_JSON_SUCCESS";
export const FETCH_JSON_RESET = "FETCH_JSON_RESET";

export function fetchJsonRequest(key: string, url: string) {
	return {
		type: FETCH_JSON_REQUEST,
		key: key,
		url: url,
	};
}

export function fetchJsonFailure(key: string, error: unknown) {
	return {
		type: FETCH_JSON_FAILURE,
		key: key,
		error: error,
	};
}

export function fetchJsonSuccess(key: string, data: unknown) {
	return {
		type: FETCH_JSON_SUCCESS,
		key: key,
		data: data,
	};
}

export function fetchJsonReset(key: string) {
	return {
		type: FETCH_JSON_RESET,
		key: key,
	};
}

export const FETCH_JSON_STATUS_LOADING = "loading";
export const FETCH_JSON_STATUS_ERROR = "error";
export const FETCH_JSON_STATUS_SUCCESS = "success";

export function fetchJson(key: string, url: string = key): ThunkAction {
	return (dispatch, getState) => {
		// do not fetch again if already running
		{
			const appState = getState().app as UiState;
			if (
				appState[key]?.url === url &&
				appState[key].status === FETCH_JSON_STATUS_LOADING
			) {
				return;
			}
		}

		dispatch(fetchJsonRequest(key, url));

		const requestUrl = ensureFullUrl(url);

		// Do not use catch, because that will also catch
		// any errors in the dispatch and resulting render,
		// causing a loop of 'Unexpected batch number' errors.
		// https://github.com/facebook/react/issues/6895
		fetch(requestUrl)
			.then(
				(response) => response.text(),
				(error) => {
					// discard response if url changed
					const state = (getState().app as UiState)[key];
					if (state && state.url !== url) {
						return Promise.reject();
					}

					dispatch(fetchJsonFailure(key, error));

					return Promise.reject();
				},
			)
			.then((data) => {
				// discard response if url changed
				const state = (getState().app as UiState)[key];
				if (state && state.url !== url) {
					return;
				}

				try {
					const json = JSON.parse(data);
					dispatch(fetchJsonSuccess(key, json));
				} catch (error) {
					dispatch(fetchJsonFailure(key, error));
				}
			})
			.catch((error) => {
				console.error(error);
				dispatch(fetchJsonFailure(key, error));
			});
	};
}

export const SEARCH = "SEARCH";

export const search = (query: string | null): ActionOrThunk =>
	query
		? (dispatch) => {
				trackSiteSearch(query, "MapsightToolbarSearch"); // historical keyword (search was in a toolbar once)

				const searchRequestUrl = updateQueryStringParameter(
					siteConfig.searchUrl,
					siteConfig.searchQueryParameter,
					query,
				); // FIXME Paul, is it ok, that query now gets transformed by encodeURI?
				dispatch({type: SEARCH, query: query});
				dispatch(fetchJson("searchResult", searchRequestUrl));
			}
		: {type: SEARCH, query: ""};

export const SELECT_SEARCH_RESULT = "SELECT_SEARCH_RESULT";

export const selectSearchResult = (feature: MapsightUiFeatureId) => ({
	type: SELECT_SEARCH_RESULT,
	feature: feature,
});

export const setFeatureDetailsUrl =
	(detailsUrl: string): ThunkAction =>
	(dispatch, getState) => {
		const currentUrl = featureDetailsUrlSelector(
			getState() as {app: UiState},
		);
		if (currentUrl !== detailsUrl) {
			if (detailsUrl) {
				dispatch(fetchText(DETAILS_CONTENT_STATE_KEY, detailsUrl));
			} else {
				dispatch(fetchTextReset(DETAILS_CONTENT_STATE_KEY));
			}
		}
	};

export const SET_TAG_VISIBLE = "SET_TAG_VISIBLE";

export const setTagVisible = (
	featureSourceId: string,
	tagGroup: string,
	tag: string,
	visible: boolean,
) => ({
	type: SET_TAG_VISIBLE,
	featureSourceId: featureSourceId,
	tagGroup: tagGroup,
	tag: tag,
	visible: visible,
});

export const SET_TAG_GROUP_VISIBLE = "SET_TAG_GROUP_VISIBLE";

export const setTagGroupVisible = (
	featureSourceId: string,
	tagGroup: string,
	visible: boolean,
) => ({
	type: SET_TAG_GROUP_VISIBLE,
	featureSourceId: featureSourceId,
	tagGroup: tagGroup,
	visible: visible,
});

export const HIDE_TAG_AND_TAG_GROUP = "HIDE_TAG_AND_TAG_GROUP";

export const hideTagAndTagGroup = () => ({
	type: HIDE_TAG_AND_TAG_GROUP,
});

export const SET_OVERLAY_MODAL_VISIBLE = "SET_OVERLAY_MODAL_VISIBLE";

export function setOverlayModalVisible(visible: boolean) {
	return {
		type: SET_OVERLAY_MODAL_VISIBLE,
		visible: visible,
	};
}

export const SET_SELECTED_REGION_ID = "MS_APP_SET_SELECTED_REGION_ID";

export function setSelectedRegionId(regionId: string | null) {
	return {
		type: SET_SELECTED_REGION_ID,
		payload: regionId,
	};
}

export function setSelectedRegionIdAndAnimateMap(
	regionId: string | null,
): ActionOrThunk {
	if (regionId === null) {
		return setSelectedRegionId(regionId);
	}

	return (dispatch, getState) => {
		dispatch(setSelectedRegionId(regionId));

		// TODO: use `selectedRegionSelector`, not sure if it's safe to rely on the state
		// change here
		const regions = regionsSelector(getState() as {app: UiState});

		if (
			regions &&
			typeof regions === "object" &&
			typeof regions[regionId] === "object" &&
			Array.isArray(regions[regionId].bounds) &&
			regions[regionId].bounds.length === 4
		) {
			dispatch(
				animateMap("map", {
					nearest: true,
					duration: 1000,
					easing: easeOut,
					bounds: regions[regionId].bounds as Extent,
				}),
			);
		}
	};
}
