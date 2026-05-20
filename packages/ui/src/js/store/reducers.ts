import type {Action, AnyAction} from "@reduxjs/toolkit";

import getPath from "@mapsight/lib-js/object/getPath";
import reducers from "@mapsight/lib-redux/reducers/immutable-path";

import {
	VIEW_DESKTOP,
	VIEW_FULLSCREEN,
	VIEW_MAP_ONLY,
	VIEW_MOBILE,
} from "../config/constants/app";
import {TAG_FILTER} from "../config/constants/controllers";
import type {UiState} from "../types.ts";
import {
	FETCH_JSON_FAILURE,
	FETCH_JSON_REQUEST,
	FETCH_JSON_RESET,
	FETCH_JSON_STATUS_ERROR,
	FETCH_JSON_STATUS_LOADING,
	FETCH_JSON_STATUS_SUCCESS,
	FETCH_JSON_SUCCESS,
	FETCH_TEXT_FAILURE,
	FETCH_TEXT_REQUEST,
	FETCH_TEXT_RESET,
	FETCH_TEXT_STATUS_ERROR,
	FETCH_TEXT_STATUS_LOADING,
	FETCH_TEXT_STATUS_SUCCESS,
	FETCH_TEXT_SUCCESS,
	FILTER_LIST_QUERY,
	HIDE_TAG_AND_TAG_GROUP,
	LIST_PAGE_NEXT,
	LIST_PAGE_PREVIOUS,
	LIST_PAGE_SET,
	SEARCH,
	SELECT_SEARCH_RESULT,
	SET_APP_TITLE,
	SET_LAST_LIST_SCROLL_POSITION,
	SET_LIST_CYCLING_CONTROL,
	SET_LIST_FILTER_CONTROL,
	SET_LIST_HIGHLIGHT_ON_MOUSE,
	SET_LIST_INTEGRATED,
	SET_LIST_ITEMS_PER_PAGE,
	SET_LIST_PAGINATION_CONTROL,
	SET_LIST_SCROLL_ON_PRESELECTION,
	SET_LIST_SELECTION_BEHAVIOR,
	SET_LIST_SELECTION_BEHAVIOR_SELECTION,
	SET_LIST_SELECT_ON_CLICK,
	SET_LIST_SORT_CONTROL,
	SET_LIST_VISIBLE,
	SET_MAP_IS_OUT_OF_VIEWPORT,
	SET_MAP_VISIBLE,
	SET_META_TAGS,
	SET_MINI_LEGEND_LAYER,
	SET_OVERLAY_MODAL_VISIBLE,
	SET_PAGE_TITLE_SHOW,
	SET_SELECTED_REGION_ID,
	SET_TAG_FILTER_CONTROL,
	SET_TAG_GROUP_VISIBLE,
	SET_TAG_VISIBLE,
	SET_TIME_FILTER_VISIBLE,
	SET_USER_PREFERENCE_LIST_VISIBLE,
	SET_VIEW,
	SET_VIEW_BREAKPOINTS,
	SORT_LIST,
	TOGGLE_USER_PREFERENCE_LIST_VISIBLE,
} from "./actions.ts";

function determineView(state: UiState, isMobile: boolean) {
	const {
		view,
		viewDefaultDesktop = VIEW_DESKTOP,
		viewDefaultMobile = VIEW_MOBILE,
	} = state;

	if (view === VIEW_DESKTOP && isMobile) {
		return viewDefaultMobile; // desktop -> mobile
	}

	if (view === VIEW_MOBILE && !isMobile) {
		return viewDefaultDesktop; // mobile -> desktop
	}

	if (view === VIEW_FULLSCREEN && isMobile) {
		// fullscreen (desktop) -> mobile
		return viewDefaultDesktop === VIEW_DESKTOP
			? VIEW_MAP_ONLY
			: viewDefaultMobile;
	}

	if (view === VIEW_MAP_ONLY && !isMobile) {
		// mapOnly (mobile fullscreen) -> desktop
		return VIEW_FULLSCREEN;
	}

	return view;
}

function mapsightUiAppReducer(
	state: UiState = {},
	action: Record<string, any> & Action,
): UiState {
	switch (action.type) {
		case SET_PAGE_TITLE_SHOW:
			return {
				...state,
				pageTitle: {
					...state.pageTitle,
					show: action.value,
				},
			};
		case SET_APP_TITLE:
			return {...state, title: action.value};
		case SET_META_TAGS:
			return {...state, metaTags: action.value};
		case SET_MINI_LEGEND_LAYER:
			return {...state, miniLegendLayer: action.value};
		case SET_VIEW:
			return {...state, view: action.value};
		case SET_LIST_VISIBLE:
			return {
				...state,
				list: {
					...state.list,
					show: action.value,
				},
			};
		case SET_USER_PREFERENCE_LIST_VISIBLE:
			return {...state, userPreferenceListVisible: action.value};
		case SET_LIST_SCROLL_ON_PRESELECTION:
			return {
				...state,
				list: {
					...state.list,
					scrollToItemOnPreselect: action.value,
				},
			};
		case SET_LIST_SELECTION_BEHAVIOR:
			return {
				...state,
				list: {
					...state.list,
					selectionBehavior: {
						...state.list?.selectionBehavior,
						...action.value,
					},
				},
			};
		case SET_LIST_SELECTION_BEHAVIOR_SELECTION:
			return {
				...state,
				list: {
					...state.list,
					selectionBehaviorSelection: action.value,
				},
			};
		case SET_LIST_SELECT_ON_CLICK:
			return {
				...state,
				list: {
					...state.list,
					selectOnClick: action.value,
				},
			};
		case SET_LIST_HIGHLIGHT_ON_MOUSE:
			return {
				...state,
				list: {
					...state.list,
					highlightOnMouse: action.value,
				},
			};
		case SET_LIST_INTEGRATED:
			return {
				...state,
				list: {
					...state.list,
					integratedList: action.value,
				},
			};
		case SET_LIST_FILTER_CONTROL:
			return {
				...state,
				list: {
					...state.list,
					filterControl: action.value,
				},
			};
		case SET_LIST_SORT_CONTROL:
			return {
				...state,
				list: {
					...state.list,
					sortControl: action.value,
				},
			};
		case SET_LIST_CYCLING_CONTROL:
			return {
				...state,
				list: {
					...state.list,
					cyclingControl: action.value,
				},
			};
		case SET_TAG_FILTER_CONTROL:
			return {
				...state,
				tagFilter: {
					...state.tagFilter,
					featureSourceId: action.featureSourceId,
				},
				tagSwitcher: {
					...state.tagSwitcher,
					...action.tagSwitcherOptions,
					show:
						action.featureSourcesControllerName &&
						action.featureSourceId &&
						action.show,
					featureSourcesControllerName:
						action.featureSourcesControllerName,
					featureSourceId: action.featureSourceId,
				},
			};
		case SET_LIST_PAGINATION_CONTROL:
			return {
				...state,
				list: {
					...state.list,
					paginationControl: action.value,
				},
			};
		case SET_LIST_ITEMS_PER_PAGE:
			return {
				...state,
				list: {
					...state.list,
					itemsPerPage: action.value,
				},
			};
		case SET_MAP_VISIBLE:
			return {
				...state,
				map: {
					...state.map,
					show: action.value,
				},
			};
		case SET_MAP_IS_OUT_OF_VIEWPORT:
			return {...state, mapIsOutOfViewport: action.value};
		case TOGGLE_USER_PREFERENCE_LIST_VISIBLE:
			return {
				...state,
				userPreferenceListVisible: !state.userPreferenceListVisible,
			};
		case SET_LAST_LIST_SCROLL_POSITION:
			return {...state, lastListScrollPosition: action.value};
		case SET_VIEW_BREAKPOINTS:
			return {
				...state,
				// Switch between mobile/desktop
				view: determineView(state, action.value.indexOf("mobile") > -1),
				viewBreakpoints: action.value,
			};
		case FETCH_TEXT_REQUEST:
			return {
				...state,
				[action.key]: {
					url: action.url,
					status: FETCH_TEXT_STATUS_LOADING,
					data: state[action.key] && state[action.key].data, // keep data while loading?
					error: null,
					lastUpdate: null,
				},
			};
		case FETCH_TEXT_FAILURE:
			return {
				...state,
				[action.key]: {
					...state[action.key],
					status: FETCH_TEXT_STATUS_ERROR,
					error: action.error,
					lastUpdate: Date.now(),
				},
			};
		case FETCH_TEXT_SUCCESS:
			return {
				...state,
				[action.key]: {
					...state[action.key],
					status: FETCH_TEXT_STATUS_SUCCESS,
					error: null,
					data: action.data,
					lastUpdate: Date.now(),
				},
			};
		case FETCH_TEXT_RESET:
			return {
				...state,
				[action.key]: {
					url: null,
					status: null,
					data: null,
					error: null,
					lastUpdate: null,
				},
			};
		case FETCH_JSON_REQUEST:
			return {
				...state,
				[action.key]: {
					url: action.url,
					status: FETCH_JSON_STATUS_LOADING,
					data: state[action.key] && state[action.key].data, // keep data while loading?
					error: null,
					lastUpdate: null,
				},
			};
		case FETCH_JSON_FAILURE:
			return {
				...state,
				[action.key]: {
					...state[action.key],
					status: FETCH_JSON_STATUS_ERROR,
					error: action.error,
					lastUpdate: Date.now(),
				},
			};
		case FETCH_JSON_SUCCESS:
			return {
				...state,
				[action.key]: {
					...state[action.key],
					status: FETCH_JSON_STATUS_SUCCESS,
					error: null,
					data: action.data,
					lastUpdate: Date.now(),
				},
			};
		case FETCH_JSON_RESET:
			return {
				...state,
				[action.key]: {
					url: null,
					status: null,
					data: null,
					error: null,
					lastUpdate: null,
				},
			};
		case FILTER_LIST_QUERY:
			return {
				...state,
				listQuery: action.query,
			};
		case SET_TIME_FILTER_VISIBLE:
			return {
				...state,
				timeFilter: {
					...state.timeFilter,
					show: action.value,
				},
			};
		case SELECT_SEARCH_RESULT:
			return {
				...state,
				searchQuery: "",
				searchResultSelectionFeatures: [action.feature],
			};
		case SEARCH:
			return {
				...state,
				searchQuery: action.query,
			};
		case SORT_LIST:
			return {
				...state,
				listSorting: action.sorting,
			};
		case LIST_PAGE_SET:
			return {
				...state,
				listPage: action.page,
			};
		case LIST_PAGE_NEXT:
			return {
				...state,
				listPage: (state.listPage || 0) + 1,
			};
		case LIST_PAGE_PREVIOUS:
			return {
				...state,
				listPage: Math.max(0, (state.listPage || 0) - 1),
			};

		case SET_OVERLAY_MODAL_VISIBLE:
			return {
				...state,
				isOverlayModalVisible: action.visible,
			};

		case SET_SELECTED_REGION_ID:
			return {
				...state,
				selectedRegion: action.payload,
			};

		default:
			return state;
	}
}

function reduceSetGroupVisible(
	state: UiState,
	action: Action & {
		visible: boolean;
		featureSourceId: string;
		tagGroup: string;
	},
) {
	// TODO: Make exclusivity optional!
	if (action.visible) {
		// deselect tags in other groups
		state = reducers.set(state, {
			type: "set",
			path: ["visibleTags", action.featureSourceId],
			value: {
				[action.tagGroup]: getPath(
					state,
					["visibleTags", action.featureSourceId, action.tagGroup],
					[],
				),
			},
		}) as UiState;
	} else {
		state = reducers.set(state, {
			type: "set",
			path: ["visibleTags", action.featureSourceId, action.tagGroup],
			value: {},
		}) as UiState;
	}

	// select tag group exclusively
	state = reducers.set(state, {
		type: "set",
		path: ["visibleTagGroups", action.featureSourceId],
		value: {[action.tagGroup]: !!action.visible},
	}) as UiState;

	return state;
}

function mapsightUiTagFilterReducer(state: UiState = {}, action: AnyAction) {
	switch (action.type) {
		case SET_TAG_VISIBLE:
			// FIXME SET_TAG_VISIBLE ... setzt nicht nur die Stelle im Store sondern
			//  bewirkt eine neuberechnung des Filters. Der Timefilter wird bei dieser
			//  Berechnung _hier_ integriert. erzeugen bzw. anwenden der
			//  Filterfunktion des Time-Filter ggf. hierher verlegen.
			return reducers.set(state, {
				type: action.type,
				path: [
					"visibleTags",
					action.featureSourceId,
					action.tagGroup,
					action.tag,
				],
				value: action.visible,
			}) as UiState;

		case SET_TAG_GROUP_VISIBLE:
			return reduceSetGroupVisible(
				state,
				action as {
					type: string;
					visible: boolean;
					featureSourceId: string;
					tagGroup: string;
				},
			);

		case HIDE_TAG_AND_TAG_GROUP:
			return {};

		default:
			return state;
	}
}

export default {
	app: mapsightUiAppReducer,
	[TAG_FILTER]: mapsightUiTagFilterReducer,
};
