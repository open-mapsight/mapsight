import {type ReactNode, memo} from "react";
import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {act, cleanup, render, renderHook} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

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

afterEach(cleanup);

// Count hook executions, not just stable returned objects or unchanged DOM.
function renderRows(showSelectedOnly = false, observeGlobalSelection = false) {
	const store = configureStore({
		reducer: (
			state = {
				app: {view: VIEW_DESKTOP as string},
				[FEATURE_SELECTIONS]: {
					select: {features: [] as string[]},
					highlight: {features: [] as string[]},
					preselect: {features: [] as string[]},
				},
			},
			action: {type: string; ids?: string[]; view?: string},
		) => {
			if (action.type === "view")
				return {...state, app: {view: action.view!}};
			if (["select", "highlight", "preselect"].includes(action.type)) {
				return {
					...state,
					[FEATURE_SELECTIONS]: {
						...state[FEATURE_SELECTIONS],
						[action.type]: {features: action.ids ?? []},
					},
				};
			}
			return state;
		},
	});
	const renders = {a: 0, b: 0, c: 0};
	const states = {} as Record<
		"a" | "b" | "c",
		ReturnType<typeof useFeatureListItemState>
	>;
	const features = Object.keys(renders).map((id) => ({...feature, id}));
	const Row = memo(function Row({item}: {item: MapsightUiFeature}) {
		renders[item.id as keyof typeof renders]++;
		states[item.id as keyof typeof states] = useFeatureListItemState(item, {
			observeGlobalSelection,
		});
		return null;
	});
	const children = features.map((item) => <Row key={item.id} item={item} />);
	const tree = (only: boolean) => (
		<Provider store={store}>
			<FeatureListContextProvider
				value={listContext({
					showSelectedOnly: only,
					selectionBehavior: {
						desktop: null,
						mobile: "expandInList",
					},
				})}
			>
				{children}
			</FeatureListContextProvider>
		</Provider>
	);
	const mounted = render(tree(showSelectedOnly));
	return {
		renders,
		states,
		select: (ids: string[]) =>
			act(() => {
				store.dispatch({type: "select", ids});
			}),
		selection: (type: string, ids: string[]) =>
			act(() => {
				store.dispatch({type, ids});
			}),
		view: (view: string) =>
			act(() => {
				store.dispatch({type: "view", view});
			}),
		options: (only: boolean) => mounted.rerender(tree(only)),
	};
}

describe("row selection subscriptions", () => {
	it("renders only affected rows on none → A → B → none when all rows are shown", () => {
		const {renders, states, select} = renderRows();
		const untouched = states.c;
		select(["a"]);
		expect(renders).toEqual({a: 2, b: 1, c: 1});
		expect(states.a.showDetails).toBe(false);
		expect(states.c).toBe(untouched);
		select(["b"]);
		expect(renders).toEqual({a: 3, b: 2, c: 1});
		expect(states.a.showDetails).toBe(false);
		expect(states.b.showDetails).toBe(false);
		select([]);
		expect(renders).toEqual({a: 3, b: 3, c: 1});
		expect(states.b.isSelected).toBe(false);
	});

	it("keeps global visibility for selected-only lists and option changes with active selection", () => {
		const {states, select, options} = renderRows(true);
		expect(Object.values(states).map((s) => s.hidden)).toEqual([
			false,
			false,
			false,
		]);
		select(["a"]);
		expect(Object.values(states).map((s) => s.hidden)).toEqual([
			false,
			true,
			true,
		]);
		select(["b"]);
		expect(Object.values(states).map((s) => s.hidden)).toEqual([
			true,
			false,
			true,
		]);
		options(false);
		expect(Object.values(states).map((s) => s.hidden)).toEqual([
			false,
			false,
			false,
		]);
		options(true);
		expect(Object.values(states).map((s) => s.hidden)).toEqual([
			true,
			false,
			true,
		]);
		select([]);
		expect(Object.values(states).map((s) => s.hidden)).toEqual([
			false,
			false,
			false,
		]);
	});

	it("retains targeted highlight/preselect and responsive view updates", () => {
		const {renders, states, selection, view, select} = renderRows();
		selection("highlight", ["a"]);
		selection("preselect", ["b"]);
		expect(renders).toEqual({a: 2, b: 2, c: 1});
		expect(states.a.isHighlighted).toBe(true);
		expect(states.b.isPreselected).toBe(true);
		selection("highlight", []);
		selection("preselect", []);
		expect(renders).toEqual({a: 3, b: 3, c: 1});
		select(["a"]);
		view(VIEW_MOBILE);
		expect(states.a.isMobile).toBe(true);
		expect(states.a.showDetails).toBe(true);
		expect(states.a.scrollOnSelection).toBe(true);
		expect(states.c.isMobile).toBe(true);
		view(VIEW_DESKTOP);
		expect(states.a.showDetails).toBe(false);
		expect(states.a.scrollOnSelection).toBe(false);
	});
});

it("preserves the global hasSelection result for existing direct hook callers", () => {
	const {result} = renderState(VIEW_DESKTOP, {}, true);
	expect(result.current.hasSelection).toBe(true);
	const {states, renders, select} = renderRows(false, true);
	expect(states.c.hasSelection).toBe(false);
	select(["a"]);
	expect(states.c.isSelected).toBe(false);
	expect(states.c.hasSelection).toBe(true);
	expect(states.c.hidden).toBe(false);
	expect(renders).toEqual({a: 2, b: 2, c: 2});
	select([]);
	expect(states.c.hasSelection).toBe(false);
});
