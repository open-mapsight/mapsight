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
	properties: {name: "Station", group: "Places"},
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

function addFocusTarget(container: HTMLElement, className: string) {
	const target = document.createElement("div");
	target.className = className;
	target.getClientRects = () =>
		[new DOMRect(0, 0, 100, 100)] as unknown as DOMRectList;
	container.querySelector(".ms3-wrapper")!.append(target);
	return target;
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
	it("announces debounced loading, count, empty and error states in one status apart from the results", () => {
		const {store} = setup(
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
		void act(() =>
			store.dispatch({type: "RESULT", status: "empty", features: []}),
		);
		void act(() => vi.advanceTimersByTime(300));
		expect(status.textContent).toBe("Keine Treffer");
		void act(() =>
			store.dispatch({type: "RESULT", status: "error", features: []}),
		);
		void act(() => vi.advanceTimersByTime(300));
		expect(status.textContent).toBe("Fehler beim Laden der Suchergebnisse");
		expect(screen.getAllByRole("status")).toHaveLength(1);
	});

	it("lets hosts disable the status and the selection announcement", () => {
		setup({announceResults: false});
		expect(screen.queryByRole("status")).toBeNull();
		fireEvent.click(screen.getByRole("button", {name: "Station"}));
		void act(() => vi.advanceTimersByTime(0));
		expect(document.activeElement).toBe(screen.getByRole("searchbox"));
		expect(announceStatus).not.toHaveBeenCalled();
	});
});

describe("result selection focus", () => {
	it("returns focus to the input and announces selection when no details are visible", () => {
		const {container} = setup();
		const hiddenDetails = addFocusTarget(
			container,
			"ms3-feature-selection-info__wrapper",
		);
		hiddenDetails.hidden = true;
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
		const target = addFocusTarget(container, className);
		fireEvent.click(screen.getByRole("button", {name: "Station"}));
		void act(() => vi.advanceTimersByTime(0));
		expect(document.activeElement).toBe(target);
		expect(announceStatus).not.toHaveBeenCalled();
	});

	it("calls onResultSelected after the results unmount and keeps the focus the host sets", () => {
		const onResultSelected = vi.fn(() => {
			expect(screen.queryByRole("button", {name: "Station"})).toBeNull();
			screen.getByRole("searchbox").focus();
		});
		const {container} = setup({onResultSelected});
		addFocusTarget(container, "ms3-feature-selection-info__wrapper");
		fireEvent.click(screen.getByRole("button", {name: "Station"}));
		void act(() => vi.advanceTimersByTime(0));
		expect(onResultSelected).toHaveBeenCalledWith(feature);
		expect(document.activeElement).toBe(screen.getByRole("searchbox"));
		expect(announceStatus).not.toHaveBeenCalled();
	});
});

it("supports a host-selected heading level for search groups", () => {
	setup({groupHeadlineAs: "h2"});
	expect(
		screen.getByRole("heading", {level: 2, name: "Places"}),
	).toBeTruthy();
});
