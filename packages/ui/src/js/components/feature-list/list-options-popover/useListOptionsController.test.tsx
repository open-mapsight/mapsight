import {type ReactNode} from "react";
import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {act, renderHook} from "@testing-library/react";
import {describe, expect, it} from "vitest";

import {
	FEATURE_LIST,
	FEATURE_SOURCES,
	TAG_FILTER,
	USER_GEOLOCATION,
} from "../../../config/constants/controllers";
import {
	FILTER_LIST_QUERY,
	HIDE_TAG_AND_TAG_GROUP,
	SORT_LIST,
} from "../../../store/actions";
import {
	FeatureListContextProvider,
	type FeatureListContextValue,
} from "../context";
import useListOptionsController from "./useListOptionsController";

type TestState = {
	app: {
		listQuery?: string;
		listSorting?: string;
		places: Record<string, never>;
		tagSwitcher?: {featureSourceId?: string};
	};
	[FEATURE_LIST]: {featureSource?: string};
	[FEATURE_SOURCES]: Record<string, {data?: {features: Array<{id: string}>}}>;
	[TAG_FILTER]: {
		visibleTagGroups?: Record<string, Record<string, boolean>>;
		visibleTags?: Record<string, Record<string, Record<string, boolean>>>;
	};
	[USER_GEOLOCATION]: {isRequesting?: boolean};
};

function listContext(
	overrides: Partial<FeatureListContextValue["state"]> = {},
): FeatureListContextValue {
	return {
		state: {
			features: [],
			featureCount: 0,
			...overrides,
		} as FeatureListContextValue["state"],
		listUiOptions: {},
		enableKeyboardControl: false,
		showFeatureListInfo: false,
		selectFeature: () => {},
		deselectFeature: () => {},
		itemProps: {
			showFeatureListInfo: false,
			enableKeyboardControl: false,
			selectFeature: () => {},
			deselectFeature: () => {},
		},
	};
}

function makeStore(state: TestState) {
	return configureStore({
		reducer: {
			app: (
				current = state.app,
				action: {type: string; query?: string; sorting?: string},
			) => {
				if (action.type === FILTER_LIST_QUERY) {
					return {...current, listQuery: action.query};
				}
				if (action.type === SORT_LIST) {
					return {...current, listSorting: action.sorting};
				}
				return current;
			},
			[FEATURE_LIST]: (current = state[FEATURE_LIST]) => current,
			[FEATURE_SOURCES]: (current = state[FEATURE_SOURCES]) => current,
			[TAG_FILTER]: (
				current = state[TAG_FILTER],
				action: {type: string},
			) =>
				action.type === HIDE_TAG_AND_TAG_GROUP
					? {visibleTagGroups: {}, visibleTags: {}}
					: current,
			[USER_GEOLOCATION]: (current = state[USER_GEOLOCATION]) => current,
		},
		preloadedState: state,
	});
}

function baseState(
	overrides: {
		app?: Partial<TestState["app"]>;
		tagFilter?: TestState[typeof TAG_FILTER];
		sources?: TestState[typeof FEATURE_SOURCES];
	} = {},
): TestState {
	return {
		app: {places: {}, ...overrides.app},
		[FEATURE_LIST]: {featureSource: "pois"},
		[FEATURE_SOURCES]: overrides.sources ?? {
			pois: {data: {features: [{id: "a"}, {id: "b"}, {id: "c"}]}},
		},
		[TAG_FILTER]: {
			visibleTagGroups: {},
			visibleTags: {},
			...overrides.tagFilter,
		},
		[USER_GEOLOCATION]: {},
	};
}

function renderController(
	state: TestState,
	contextOverrides?: Partial<FeatureListContextValue["state"]>,
) {
	const store = makeStore(state);
	const wrapper = ({children}: {children: ReactNode}) => (
		<Provider store={store}>
			<FeatureListContextProvider value={listContext(contextOverrides)}>
				{children}
			</FeatureListContextProvider>
		</Provider>
	);
	return renderHook(() => useListOptionsController(), {wrapper});
}

describe("useListOptionsController", () => {
	it("reports idle options and the raw feature-source total", () => {
		const {result} = renderController(baseState(), {
			features: [
				{id: "a"},
			] as FeatureListContextValue["state"]["features"],
			featureCount: 1,
		});

		expect(result.current.featureCount).toBe(1);
		expect(result.current.totalFeatureCount).toBe(3);
		expect(result.current.activeFilterCount).toBe(0);
		expect(result.current.canResetOptions).toBe(false);
		expect(result.current.hasCustomSorting).toBe(false);
		expect(result.current.sorting).toBe("");
	});

	it("counts a list query as an active filter that can be reset", () => {
		const {result} = renderController(
			baseState({app: {listQuery: "cafe"}}),
		);

		expect(result.current.activeFilterCount).toBe(1);
		expect(result.current.canResetOptions).toBe(true);
	});

	it("counts a visible tag as an active filter", () => {
		const {result} = renderController(
			baseState({
				app: {tagSwitcher: {featureSourceId: "pois"}},
				tagFilter: {
					visibleTags: {pois: {group: {open: true}}},
				},
			}),
		);

		expect(result.current.activeFilterCount).toBe(1);
		expect(result.current.canResetOptions).toBe(true);
	});

	it("treats a user sort as custom and resettable", () => {
		const {result} = renderController(
			baseState({app: {listSorting: "center"}}),
		);

		expect(result.current.hasCustomSorting).toBe(true);
		expect(result.current.canResetOptions).toBe(true);
		expect(result.current.sorting).toBe("center");
	});

	it("reset clears query, tags, and custom sorting", () => {
		const {result} = renderController(
			baseState({
				app: {
					listQuery: "cafe",
					listSorting: "center",
					tagSwitcher: {featureSourceId: "pois"},
				},
				tagFilter: {
					visibleTags: {pois: {group: {open: true}}},
				},
			}),
		);

		expect(result.current.activeFilterCount).toBe(2);
		expect(result.current.canResetOptions).toBe(true);

		act(() => {
			result.current.reset();
		});

		expect(result.current.activeFilterCount).toBe(0);
		expect(result.current.hasCustomSorting).toBe(false);
		expect(result.current.canResetOptions).toBe(false);
		expect(result.current.sorting).toBe("");
	});
});
