import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {
	act,
	cleanup,
	fireEvent,
	render,
	renderHook,
} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {
	VIEW_DESKTOP,
	VIEW_MAP_ONLY,
	VIEW_MOBILE,
} from "../../config/constants/app";
import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {
	FEATURE_SELECTION_HIGHLIGHT,
	FEATURE_SELECTION_PRESELECT,
	FEATURE_SELECTION_SELECT,
} from "../../config/feature/selections";
import {setView} from "../../store/actions";
import type {MapsightUiFeature} from "../../types";
import {
	FeatureListContextProvider,
	type FeatureListContextValue,
} from "../feature-list/context";
import useSelectFeature from "../feature-list/hooks/useSelectFeature";
import FeatureListItem from "./index";

vi.mock("../feature-details-content", () => ({
	default: () => (
		<div>
			<button type="button">Details action</button>
			<div role="dialog">
				<button type="button">Nested action</button>
			</div>
		</div>
	),
}));

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

function makeStore(view = VIEW_DESKTOP, list = listContext.listUiOptions) {
	return configureStore({
		reducer: {
			app: (state = {view, list}) => state,
			[FEATURE_SELECTIONS]: (
				state = emptySelections(),
				action: {type: string; features?: string[]},
			) => {
				if (action.type === "test/select") {
					return {
						...state,
						[FEATURE_SELECTION_SELECT]: {
							features: action.features ?? [],
						},
					};
				}
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

		expect(
			container.querySelector(".ms3-list__item--highlight"),
		).not.toBeNull();
		expect(container.querySelector(".bs-contact__picture__image")).toBe(
			img,
		);
	});
});

function renderInlineRow(mobileNavigation = false) {
	const store = makeStore(VIEW_MOBILE);
	const context = {
		...listContext,
		listUiOptions: {
			...listContext.listUiOptions,
			detailsInList: true,
			showSelectedOnly: true,
			selectionBehavior: {
				desktop: "scrollToMap" as const,
				mobile: mobileNavigation
					? ("showInMapOnlyView" as const)
					: ("expandInList" as const),
			},
		},
	};
	const {container, getByText} = render(
		<Provider store={store}>
			<FeatureListContextProvider value={context}>
				<FeatureListItem
					as="li"
					feature={museumFeature()}
					selectFeature={() =>
						store.dispatch({
							type: "test/select",
							features: ["museum-1"],
						})
					}
					deselectFeatures={() =>
						store.dispatch({type: "test/select", features: []})
					}
				/>
			</FeatureListContextProvider>
		</Provider>,
	);
	const trigger = container.querySelector<HTMLButtonElement>(
		"[data-ms3-list-nav]",
	)!;
	return {container, getByText, trigger};
}

it("treats mobile round-tour map navigation as selection even with detailsInList", () => {
	const {trigger} = renderInlineRow(true);
	// The real list action switches views, rather than opening a popup.
	const store = makeStore(VIEW_MOBILE, {
		...listContext.listUiOptions,
		detailsInList: true,
		showSelectedOnly: true,
		selectionBehavior: {
			desktop: "scrollToMap",
			mobile: "showInMapOnlyView",
		},
	});
	const {result} = renderHook(() => useSelectFeature(), {
		wrapper: ({children}) => <Provider store={store}>{children}</Provider>,
	});
	expect(result.current("museum-1")).toEqual(
		expect.objectContaining({
			payload: expect.arrayContaining([setView(VIEW_MAP_ONLY)]),
		}),
	);
	expect(trigger.getAttribute("aria-expanded")).toBeNull();
	expect(trigger.getAttribute("aria-controls")).toBeNull();
	expect(trigger.getAttribute("aria-pressed")).toBe("false");
	fireEvent.keyDown(trigger, {key: "Enter"});
	expect(trigger.getAttribute("aria-pressed")).toBe("true");
});

it("closes inline details on scoped Escape and restores focus to their trigger", () => {
	const {container, getByText, trigger} = renderInlineRow();
	const details = document.getElementById(
		trigger.getAttribute("aria-controls")!,
	)!;
	expect(trigger.getAttribute("aria-expanded")).toBe("false");
	expect(details.hidden).toBe(true);
	fireEvent.keyDown(trigger, {key: "Enter"});
	expect(trigger.getAttribute("aria-expanded")).toBe("true");
	expect(details.hidden).toBe(false);
	fireEvent.keyDown(document.body, {key: "Escape"});
	fireEvent.keyDown(getByText("Nested action"), {key: "Escape"});
	const action = getByText("Details action");
	action.addEventListener("keydown", (event) => event.preventDefault(), {
		once: true,
	});
	fireEvent.keyDown(action, {key: "Escape"});
	expect(trigger.getAttribute("aria-expanded")).toBe("true");
	action.focus();
	fireEvent.keyDown(action, {key: "Escape"});
	expect(trigger.getAttribute("aria-expanded")).toBe("false");
	expect(details.hidden).toBe(true);
	expect(document.activeElement).toBe(trigger);
	expect(container.querySelector(".ms3-list__item--selected")).toBeNull();
});
