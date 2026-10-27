import type {ComponentProps} from "react";
import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {act, cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {announceStatus} from "../../helpers/announce-status";
import {setDocumentLanguage} from "../../helpers/i18n";
import Search from "./index";

vi.mock("../../helpers/announce-status", () => ({announceStatus: vi.fn()}));
vi.mock("../../store/actions", () => ({
	search: (query: string) => ({type: "REQUEST", query}),
	selectSearchResult: () => ({type: "SELECT_SEARCH_RESULT"}),
}));
vi.mock("../../store/selectors", () => ({
	searchQuerySelector: (state: SearchState) => state.query,
	searchStatusSelector: (state: SearchState) => state.status,
	searchResultFeaturesSelector: (state: SearchState) => state.features,
}));

const feature = {
	id: "station",
	properties: {name: "Station", group: "Places", isIncompleteSuggest: false},
};
type SearchState = {
	query: string;
	status: string;
	features: (typeof feature)[];
};

function setup(
	props: ComponentProps<typeof Search> = {},
	initial: Partial<SearchState> = {},
) {
	const store = configureStore({
		reducer: (
			state: SearchState = {
				query: "station",
				status: "found",
				features: [feature],
				...initial,
			},
			action: {
				type: string;
				query?: string;
				status?: string;
				features?: (typeof feature)[];
			},
		) => {
			if (action.type === "SEARCH")
				return {...state, query: action.query!, status: "loading"};
			if (action.type === "SELECT_SEARCH_RESULT")
				return {...state, query: ""};
			if (action.type === "RESULT")
				return {
					...state,
					status: action.status!,
					features: action.features!,
				};
			return state;
		},
	});
	const view = render(
		<Provider store={store}>
			<div className="ms3-wrapper">
				<Search {...props} />
			</div>
		</Provider>,
	);
	return {...view, store};
}

beforeEach(() => {
	vi.useFakeTimers();
	setDocumentLanguage("de");
});
afterEach(() => {
	cleanup();
	vi.useRealTimers();
	vi.clearAllMocks();
});

describe("search status", () => {
	it("announces debounced loading, count and empty text separately from the results", () => {
		const {store, container} = setup(
			{},
			{query: "", status: "inactive", features: []},
		);
		const status = screen.getByRole("status");
		expect(status.textContent).toBe("");
		fireEvent.change(screen.getByRole("searchbox"), {
			target: {value: "station"},
		});
		void act(() => vi.advanceTimersByTime(299));
		expect(status.textContent).toBe("");
		void act(() => vi.advanceTimersByTime(1));
		expect(status.textContent).toBe("Suche läuft …");
		void act(() =>
			store.dispatch({
				type: "RESULT",
				status: "found",
				features: [feature, {...feature, id: "other"}],
			}),
		);
		void act(() => vi.advanceTimersByTime(300));
		expect(status.textContent).toBe("2 Treffer");
		expect(status.querySelector("button")).toBeNull();
		expect(container.querySelector("output")).toBeNull();
		void act(() =>
			store.dispatch({type: "RESULT", status: "empty", features: []}),
		);
		void act(() => vi.advanceTimersByTime(300));
		expect(status.textContent).toBe("Keine Treffer");
		expect(screen.getAllByRole("status")).toHaveLength(1);
	});

	it("announces errors and allows hosts to disable every built-in search announcement", () => {
		const {store} = setup({announceResults: false});
		void act(() =>
			store.dispatch({type: "RESULT", status: "empty", features: []}),
		);
		void act(() => vi.advanceTimersByTime(600));
		expect(screen.queryByRole("status")).toBeNull();
		cleanup();
		setup({}, {status: "error", features: []});
		expect(screen.getByRole("status").textContent).toBe(
			"Fehler beim Laden der Suchergebnisse",
		);
	});
});

describe("result selection focus", () => {
	it("returns focus to the input and announces selection when no details are shown", () => {
		setup();
		const result = screen.getByRole("button", {name: "Station"});
		result.focus();
		fireEvent.click(result);
		void act(() => vi.advanceTimersByTime(0));
		expect(screen.queryByRole("button", {name: "Station"})).toBeNull();
		expect(document.activeElement).toBe(screen.getByRole("searchbox"));
		expect(announceStatus).toHaveBeenCalledWith("Station ausgewählt");
	});

	it.each([
		"ms3-feature-selection-info__wrapper",
		"ms3-list__item--selected",
	])("focuses a visible %s", (className) => {
		const {container} = setup();
		const target = document.createElement("div");
		target.className = className;
		target.getClientRects = () =>
			[new DOMRect(0, 0, 100, 100)] as unknown as DOMRectList;
		container.querySelector(".ms3-wrapper")!.append(target);
		fireEvent.click(screen.getByRole("button", {name: "Station"}));
		void act(() => vi.advanceTimersByTime(0));
		expect(document.activeElement).toBe(target);
		expect(announceStatus).not.toHaveBeenCalled();
	});

	it("lets a host callback set focus after results unmount", () => {
		const target = document.createElement("button");
		document.body.append(target);
		const onResultSelected = vi.fn(() => {
			expect(screen.queryByRole("button", {name: "Station"})).toBeNull();
			target.focus();
		});
		setup({onResultSelected});
		fireEvent.click(screen.getByRole("button", {name: "Station"}));
		void act(() => vi.advanceTimersByTime(0));
		expect(onResultSelected).toHaveBeenCalledWith(feature);
		expect(document.activeElement).toBe(target);
		target.remove();
	});

	it("respects host focus inside the search even when details are visible", () => {
		const onResultSelected = () => screen.getByRole("searchbox").focus();
		const {container} = setup({onResultSelected});
		const target = document.createElement("div");
		target.className = "ms3-feature-selection-info__wrapper";
		target.getClientRects = () =>
			[new DOMRect(0, 0, 100, 100)] as unknown as DOMRectList;
		container.querySelector(".ms3-wrapper")!.append(target);
		fireEvent.click(screen.getByRole("button", {name: "Station"}));
		void act(() => vi.advanceTimersByTime(0));
		expect(document.activeElement).toBe(screen.getByRole("searchbox"));
		expect(announceStatus).not.toHaveBeenCalled();
	});

	it("ignores hidden details and restores focus after an incomplete suggestion", () => {
		const onResultSelected = vi.fn();
		const {container} = setup(
			{onResultSelected},
			{
				features: [
					{
						...feature,
						properties: {
							...feature.properties,
							isIncompleteSuggest: true,
						},
					},
				],
			},
		);
		const target = document.createElement("div");
		target.className = "ms3-feature-selection-info__wrapper";
		target.hidden = true;
		container.querySelector(".ms3-wrapper")!.append(target);
		fireEvent.click(screen.getByRole("button", {name: "Station"}));
		expect(document.activeElement).toBe(screen.getByRole("searchbox"));
		expect(onResultSelected).not.toHaveBeenCalled();
	});

	it("keeps focus safe without an announcement when the host opts out", () => {
		setup({announceResults: false});
		fireEvent.click(screen.getByRole("button", {name: "Station"}));
		void act(() => vi.advanceTimersByTime(0));
		expect(document.activeElement).toBe(screen.getByRole("searchbox"));
		expect(announceStatus).not.toHaveBeenCalled();
	});
});

it("supports a host-selected heading level for search groups", () => {
	const {unmount} = setup({groupHeadlineAs: "h2"});
	expect(
		screen.getByRole("heading", {level: 2, name: "Places"}),
	).toBeTruthy();
	unmount();
	setup({groupHeadlineAs: "div"});
	expect(screen.queryByRole("heading")).toBeNull();
	expect(screen.getByText("Places")).toBeTruthy();
});
