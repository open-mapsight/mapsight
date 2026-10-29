import {useRef} from "react";
import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {
	APP_EVENT_FOCUS_FEATURE_LIST,
	AppChannelProvider,
	useAppChannelDispatchEvent,
} from "../../app-channel";
import {VIEW_DESKTOP} from "../../config/constants/app";
import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {
	FEATURE_SELECTION_HIGHLIGHT,
	FEATURE_SELECTION_PRESELECT,
	FEATURE_SELECTION_SELECT,
} from "../../config/feature/selections";
import type {MapsightUiFeature} from "../../types";
import FeatureListContent from "./content";
import {
	FeatureListContextProvider,
	type FeatureListContextValue,
} from "./context";
import FeatureListGroupedContent from "./grouped-content";
import useKeyboardNavigation from "./hooks/useKeyboardNavigation";

// Inline detail internals are outside the row keyboard model.
vi.mock("../feature-details-content", () => ({
	default: () => <input aria-label="Detail input" />,
}));
beforeEach(() => {
	Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
		configurable: true,
		value: vi.fn(),
	});
});
afterEach(cleanup);

function feature(id: string, properties = {}): MapsightUiFeature {
	return {
		type: "Feature",
		id,
		geometry: {type: "Point", coordinates: [0, 0]},
		properties: {id, name: id, ...properties},
	} as MapsightUiFeature;
}

function makeStore() {
	return configureStore({
		reducer: {
			app: (state = {view: VIEW_DESKTOP}) => state,
			[FEATURE_SELECTIONS]: (
				state = {
					[FEATURE_SELECTION_SELECT]: {features: [] as string[]},
					[FEATURE_SELECTION_HIGHLIGHT]: {features: [] as string[]},
					[FEATURE_SELECTION_PRESELECT]: {features: [] as string[]},
				},
				action: {
					type: string;
					id?: string;
					features?: string[];
					name?: string;
				},
			) => {
				if (action.type === "test/select")
					return {
						...state,
						[FEATURE_SELECTION_SELECT]: {
							features: action.id ? [action.id] : [],
						},
					};
				return state;
			},
		},
	});
}

function setup(
	features: MapsightUiFeature[],
	options: Partial<FeatureListContextValue["listUiOptions"]> = {},
	enabled = false,
	groupAs?: string,
	listAs = "ul",
) {
	const store = makeStore();
	const selectFeature = vi.fn((id: string | number) =>
		store.dispatch({type: "test/select", id: String(id)}),
	);
	const deselectFeature = vi.fn(() => store.dispatch({type: "test/select"}));
	const context = (items: MapsightUiFeature[]): FeatureListContextValue => ({
		state: {
			filteredFeatures: items,
			featureSourceId: "places",
			featureSource: {data: {type: "FeatureCollection", features: items}},
		} as FeatureListContextValue["state"],
		listUiOptions: {
			renderAs: listAs,
			selectOnClick: true,
			deselectOnClick: true,
			...options,
		},
		enableKeyboardControl: enabled,
		showFeatureListInfo: false,
		selectFeature,
		deselectFeature,
		itemProps: {
			enableKeyboardControl: enabled,
			showFeatureListInfo: false,
			selectFeature,
			deselectFeature,
		},
	});
	const ui = (items: MapsightUiFeature[]) => (
		<Provider store={store}>
			<FeatureListContextProvider value={context(items)}>
				<FeatureListGroupedContent groupAs={groupAs} />
			</FeatureListContextProvider>
		</Provider>
	);
	const result = render(ui(features));
	return {
		...result,
		selectFeature,
		deselectFeature,
		rerenderFeatures: (items: MapsightUiFeature[]) =>
			result.rerender(ui(items)),
	};
}

function rows(container: HTMLElement) {
	return [...container.querySelectorAll<HTMLElement>("[data-ms3-list-nav]")];
}

function focus(element: HTMLElement) {
	act(() => element.focus());
}

describe("feature-list row keyboard model", () => {
	it.each([false, true])(
		"roves with ArrowUp/Down and Home/End with keyboard control %s",
		(enabled) => {
			const {container} = setup(
				[feature("One"), feature("Two"), feature("Three")],
				{},
				enabled,
			);
			const [one, two, three] = rows(container);
			expect(rows(container).map((row) => row.tabIndex)).toEqual([
				0, -1, -1,
			]);
			expect(
				container.querySelector(".ms3-list")?.hasAttribute("tabindex"),
			).toBe(false);
			focus(one!);
			fireEvent.keyDown(one!, {key: "ArrowDown"});
			expect(document.activeElement).toBe(two);
			expect(rows(container).map((row) => row.tabIndex)).toEqual([
				-1, 0, -1,
			]);
			fireEvent.keyDown(two!, {key: "End"});
			expect(document.activeElement).toBe(three);
			fireEvent.keyDown(three!, {key: "Home"});
			expect(document.activeElement).toBe(one);
			fireEvent.keyDown(one!, {key: "ArrowUp"});
			expect(document.activeElement).toBe(three);
			fireEvent.keyDown(three!, {key: "ArrowDown"});
			expect(document.activeElement).toBe(one);
		},
	);

	it.each([
		{
			kind: "link-only",
			options: {selectOnClick: false, deselectOnClick: false},
			properties: {permanentLink: "/place"},
			tag: "A",
		},
		{
			kind: "highlight-only",
			options: {
				selectOnClick: false,
				deselectOnClick: false,
				highlightOnMouse: true,
			},
			properties: {},
			tag: "BUTTON",
		},
		{
			kind: "obsolete HTML property",
			options: {},
			properties: {overrideListHtml: "<span>Obsolete HTML</span>"},
			tag: "BUTTON",
		},
	])(
		"includes $kind rows in the Tab order and arrow navigation",
		({options, properties, tag}) => {
			const {container} = setup(
				[feature("One", properties), feature("Two", properties)],
				options,
			);
			const [one, two] = rows(container);
			expect(one?.tagName).toBe(tag);
			expect(container.textContent).not.toContain("Obsolete HTML");
			expect(rows(container).map((row) => row.tabIndex)).toEqual([0, -1]);
			focus(one!);
			fireEvent.keyDown(one!, {key: "ArrowDown"});
			expect(document.activeElement).toBe(two);
			expect(rows(container).map((row) => row.tabIndex)).toEqual([-1, 0]);
			if (tag === "A") {
				expect(one?.getAttribute("role")).toBeNull();
				expect(one?.getAttribute("aria-pressed")).toBeNull();
			}
			expect(
				container.querySelector("li")?.getAttribute("role"),
			).toBeNull();
		},
	);

	it("keeps the current row after rerender and chooses a new Tab stop after filtering or pagination", async () => {
		const one = feature("One"),
			two = feature("Two"),
			three = feature("Three");
		const {container, rerenderFeatures} = setup([one, two, three]);
		focus(rows(container)[1]!);
		rerenderFeatures([three, two, one]);
		await waitFor(() =>
			expect(rows(container).map((row) => row.tabIndex)).toEqual([
				-1, 0, -1,
			]),
		);
		rerenderFeatures([three, one]);
		await waitFor(() =>
			expect(rows(container).map((row) => row.tabIndex)).toEqual([0, -1]),
		);
		rerenderFeatures([feature("Next page")]);
		await waitFor(() =>
			expect(rows(container).map((row) => row.tabIndex)).toEqual([0]),
		);
	});

	it("uses real lists and roves across group boundaries", () => {
		const {container} = setup(
			[feature("One", {group: "A"}), feature("Two", {group: "B"})],
			{},
			false,
			"h3",
		);
		expect(screen.getAllByRole("list")).toHaveLength(2);
		for (const row of screen.getAllByRole("listitem"))
			expect(row.parentElement?.tagName).toBe("UL");
		const [one, two] = rows(container);
		focus(one!);
		fireEvent.keyDown(one!, {key: "ArrowDown"});
		expect(document.activeElement).toBe(two);
		expect(rows(container).map((row) => row.tabIndex)).toEqual([-1, 0]);
	});

	it("renders configured and standalone lists with li rows and empty messages", () => {
		const {container, rerenderFeatures, unmount} = setup(
			[feature("One")],
			{},
			false,
			undefined,
			"ol",
		);
		expect(screen.getByRole("listitem").parentElement?.tagName).toBe("OL");
		rerenderFeatures([]);
		const empty = container.querySelector(".ms3-list__empty");
		expect(empty?.tagName).toBe("LI");
		expect(empty?.parentElement?.tagName).toBe("OL");
		unmount();
		render(<FeatureListContent />);
		expect(screen.getByRole("listitem").parentElement?.tagName).toBe("UL");
	});

	it.each([
		{permanentLink: undefined, select: "Enter", deselect: " "},
		{permanentLink: "/place", select: " ", deselect: "Enter"},
	])(
		"toggles selection with Enter and Space and exposes aria-pressed (permalink: $permanentLink)",
		({permanentLink, select, deselect}) => {
			const {selectFeature, deselectFeature} = setup([
				feature("One", {permanentLink}),
			]);
			const button = screen.getByRole("button", {name: "One"});
			expect(button.getAttribute("aria-pressed")).toBe("false");
			fireEvent.keyDown(button, {key: select});
			expect(selectFeature).toHaveBeenCalledExactlyOnceWith("One", {
				keyboard: true,
			});
			expect(button.getAttribute("aria-pressed")).toBe("true");
			fireEvent.keyDown(button, {key: deselect});
			expect(deselectFeature).toHaveBeenCalledTimes(1);
			expect(button.getAttribute("aria-pressed")).toBe("false");
		},
	);

	it("exposes inline expansion and a stable details target", () => {
		const {container} = setup([feature("One")], {
			selectionBehavior: {desktop: "expandInList", mobile: null},
		});
		const button = screen.getByRole("button", {name: "One"});
		const id = button.getAttribute("aria-controls")!;
		expect(button.hasAttribute("aria-pressed")).toBe(false);
		expect(button.getAttribute("aria-expanded")).toBe("false");
		expect(document.getElementById(id)?.hidden).toBe(true);
		fireEvent.click(button);
		expect(button.getAttribute("aria-expanded")).toBe("true");
		expect(document.getElementById(id)?.hidden).toBe(false);
		const input = screen.getByRole("textbox");
		focus(input);
		fireEvent.keyDown(input, {key: "Home"});
		expect(document.activeElement).toBe(input);
		fireEvent.keyDown(input, {key: "ArrowDown"});
		expect(document.activeElement).toBe(input);
		fireEvent.click(button);
		expect(button.getAttribute("aria-controls")).toBe(id);
		expect(button.getAttribute("aria-expanded")).toBe("false");
		expect(rows(container)[0]?.tabIndex).toBe(0);
	});

	it("safely handles focus requests on empty lists and focuses the current row", () => {
		function List({empty = false}) {
			const ref = useRef<HTMLElement>(null);
			const props = useKeyboardNavigation(false, ref);
			const dispatch = useAppChannelDispatchEvent();
			return (
				<>
					<button
						onClick={() =>
							dispatch(new Event(APP_EVENT_FOCUS_FEATURE_LIST))
						}
					>
						Focus list
					</button>
					<div {...props}>
						{!empty && <button data-ms3-list-nav="">Row</button>}
					</div>
				</>
			);
		}
		const {rerender} = render(
			<AppChannelProvider>
				<List empty />
			</AppChannelProvider>,
		);
		expect(() =>
			fireEvent.click(screen.getByText("Focus list")),
		).not.toThrow();
		rerender(
			<AppChannelProvider>
				<List />
			</AppChannelProvider>,
		);
		fireEvent.click(screen.getByText("Focus list"));
		expect(document.activeElement).toBe(screen.getByText("Row"));
	});
});
