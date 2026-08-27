import {type ReactNode} from "react";
import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {renderHook} from "@testing-library/react";
import {describe, expect, it} from "vitest";

import {VIEW_DESKTOP, VIEW_MOBILE} from "../../../config/constants/app";
import {FEATURE_SELECTIONS} from "../../../config/constants/controllers";
import {
	FEATURE_SELECTION_HIGHLIGHT,
	FEATURE_SELECTION_PRESELECT,
	FEATURE_SELECTION_SELECT,
} from "../../../config/feature/selections";
import type {MapsightUiFeature} from "../../../types";
import {
	FeatureListContextProvider,
	type FeatureListContextValue,
} from "../../feature-list/context";
import useFeatureListItemState from "./useFeatureListItemState";

const feature = {
	type: "Feature",
	id: "poi-1",
	geometry: {type: "Point", coordinates: [0, 0]},
	properties: {id: "poi-1", name: "Probe", listName: "Probe"},
} as MapsightUiFeature;

function listContext(
	overrides: Partial<FeatureListContextValue["listUiOptions"]> = {},
): FeatureListContextValue {
	return {
		state: {} as FeatureListContextValue["state"],
		listUiOptions: {
			highlightOnMouse: true,
			selectOnClick: "mainAndIcon",
			deselectOnClick: false,
			showSelectedOnly: false,
			detailsInList: false,
			selectionBehavior: {desktop: null, mobile: null},
			selectionBehaviorSelection: "select",
			...overrides,
		},
		enableKeyboardControl: false,
		showFeatureListInfo: true,
		selectFeature: () => {},
		deselectFeature: () => {},
		itemProps: {
			showFeatureListInfo: true,
			enableKeyboardControl: false,
			selectFeature: () => {},
			deselectFeature: () => {},
		},
	};
}

function renderState(
	view: typeof VIEW_DESKTOP | typeof VIEW_MOBILE,
	options: Partial<FeatureListContextValue["listUiOptions"]> = {},
	selected = true,
) {
	const store = configureStore({
		reducer: {
			app: (state = {view}) => state,
			[FEATURE_SELECTIONS]: (
				state = {
					[FEATURE_SELECTION_SELECT]: {
						features: selected ? ["poi-1"] : [],
					},
					[FEATURE_SELECTION_HIGHLIGHT]: {features: [] as string[]},
					[FEATURE_SELECTION_PRESELECT]: {features: [] as string[]},
				},
			) => state,
		},
	});
	const wrapper = ({children}: {children: ReactNode}) => (
		<Provider store={store}>
			<FeatureListContextProvider value={listContext(options)}>
				{children}
			</FeatureListContextProvider>
		</Provider>
	);

	return renderHook(() => useFeatureListItemState(feature), {wrapper});
}

describe("useFeatureListItemState showDetails", () => {
	it("shows inline details for mobile expandInList", () => {
		const {result} = renderState(VIEW_MOBILE, {
			selectionBehavior: {desktop: null, mobile: "expandInList"},
		});

		expect(result.current.showDetails).toBe(true);
	});

	it("hides inline details when mobile selection opens mapOnly", () => {
		const {result} = renderState(VIEW_MOBILE, {
			selectionBehavior: {desktop: null, mobile: "showInMapOnlyView"},
		});

		expect(result.current.showDetails).toBe(false);
	});

	it("shows inline details when detailsInList is set", () => {
		const {result} = renderState(VIEW_DESKTOP, {
			detailsInList: true,
			selectionBehavior: {desktop: "scrollToMap", mobile: null},
		});

		expect(result.current.showDetails).toBe(true);
	});
});
