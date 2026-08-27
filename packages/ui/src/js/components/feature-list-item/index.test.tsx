import {configureStore} from "@reduxjs/toolkit";
import {act, cleanup, render} from "@testing-library/react";
import {Provider} from "react-redux";
import {afterEach, describe, expect, it} from "vitest";

import {VIEW_DESKTOP} from "../../config/constants/app";
import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {
	FEATURE_SELECTION_HIGHLIGHT,
	FEATURE_SELECTION_PRESELECT,
	FEATURE_SELECTION_SELECT,
} from "../../config/feature/selections";
import type {MapsightUiFeature} from "../../types";
import {
	FeatureListContextProvider,
	type FeatureListContextValue,
} from "../feature-list/context";
import FeatureListItem from "./index";

afterEach(cleanup);

function museumFeature(): MapsightUiFeature {
	return {
		type: "Feature",
		id: "museum-1",
		geometry: {type: "Point", coordinates: [10.5, 52.2]},
		properties: {
			id: "museum-1",
			name: "Burg Dankwarderode",
			listName: "Burg Dankwarderode",
			listInformation:
				'<section class="bs-content-element"><img class="bs-contact__picture__image" src="about:blank" alt="probe" /></section>',
		},
	} as MapsightUiFeature;
}

function emptySelections() {
	return {
		[FEATURE_SELECTION_SELECT]: {features: [] as string[]},
		[FEATURE_SELECTION_HIGHLIGHT]: {features: [] as string[]},
		[FEATURE_SELECTION_PRESELECT]: {features: [] as string[]},
	};
}

function makeStore() {
	return configureStore({
		reducer: {
			app: (state = {view: VIEW_DESKTOP}) => state,
			[FEATURE_SELECTIONS]: (
				state = emptySelections(),
				action: {type: string; features?: string[]},
			) => {
				if (action.type === "test/highlight") {
					return {
						...state,
						[FEATURE_SELECTION_HIGHLIGHT]: {
							features: action.features ?? [],
						},
					};
				}
				return state;
			},
		},
	});
}

const listContext: FeatureListContextValue = {
	state: {} as FeatureListContextValue["state"],
	listUiOptions: {
		highlightOnMouse: true,
		selectOnClick: "mainAndIcon",
		deselectOnClick: false,
		showSelectedOnly: false,
		detailsInList: false,
		selectionBehavior: {desktop: null, mobile: null},
		selectionBehaviorSelection: "select",
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

describe("FeatureListItem listInformation HTML", () => {
	it("keeps the injected contact image node when highlight selection changes", () => {
		const store = makeStore();
		const {container} = render(
			<Provider store={store}>
				<FeatureListContextProvider value={listContext}>
					<FeatureListItem
						as="li"
						feature={museumFeature()}
						showFeatureListInfo={true}
					/>
				</FeatureListContextProvider>
			</Provider>,
		);

		const img = container.querySelector(".bs-contact__picture__image");
		expect(img).toBeInstanceOf(HTMLImageElement);

		act(() => {
			store.dispatch({type: "test/highlight", features: ["museum-1"]});
		});

		expect(container.querySelector(".ms3-list__item--highlight")).not.toBeNull();
		expect(container.querySelector(".bs-contact__picture__image")).toBe(img);
	});
});
