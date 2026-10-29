import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {act, cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, expect, it, vi} from "vitest";

import {HeadingsProvider} from "../../headings";
import {setDocumentLanguage} from "../../helpers/i18n";
import SwitcherEntry from "../switcher/SwitcherEntry";
import SplitBaseLayerSwitcher from "./SplitBaseLayerSwitcher";

const layers = {
	street: {metaData: {isBaseLayer: true}, options: {visible: true}},
	aerial: {metaData: {isBaseLayer: true}, options: {visible: false}},
	parking: {metaData: {group: "Places"}, options: {visible: true}},
};
const store = configureStore({reducer: () => ({map: {layers}})});
const props = {
	layerIdsSelector: () => Object.keys(layers),
	renderBaseLayerEntry: (id: string) => (
		<SwitcherEntry
			key={id}
			title={id}
			active={id === "street"}
			exclusive
			toggleActive={() => undefined}
		/>
	),
	renderEntry: (id: string) => (
		<SwitcherEntry key={id} title={id} toggleActive={() => undefined} />
	),
};

afterEach(() => {
	cleanup();
	setDocumentLanguage("de");
});

it("supports section and nested group heading levels, retaining h3/h4 defaults", () => {
	const {rerender} = render(
		<Provider store={store}>
			<SplitBaseLayerSwitcher {...props} />
		</Provider>,
	);
	expect(
		screen.getByRole("heading", {level: 3, name: "Basiskarte"}),
	).toBeTruthy();
	expect(
		screen.getByRole("heading", {level: 4, name: "Places"}),
	).toBeTruthy();
	expect(screen.getByRole("radiogroup", {name: "Basiskarte"})).toBeTruthy();
	rerender(
		<Provider store={store}>
			<SplitBaseLayerSwitcher
				{...props}
				headlineAs="h2"
				groupHeadlineAs="h3"
			/>
		</Provider>,
	);
	expect(
		screen.getByRole("heading", {level: 2, name: "Datenebenen"}),
	).toBeTruthy();
	expect(
		screen.getByRole("heading", {level: 3, name: "Places"}),
	).toBeTruthy();
	rerender(
		<Provider store={store}>
			<SplitBaseLayerSwitcher
				{...props}
				headlineAs="div"
				groupHeadlineAs="div"
			/>
		</Provider>,
	);
	expect(screen.queryByRole("heading")).toBeNull();
});

it("contains the complete visible group label and count in the toggle name in both states", () => {
	setDocumentLanguage("en");
	render(
		<Provider store={store}>
			<SplitBaseLayerSwitcher {...props} collapsibleGroups />
		</Provider>,
	);
	const toggle = screen.getByRole("button", {
		name: "Places 1/1 Collapse group",
	});
	// CSS gaps do not separate the adjacent spans for label-in-name checks.
	expect(toggle.textContent).toBe("Places 1/1");
	expect(toggle.getAttribute("aria-label")).toContain(toggle.textContent);
	expect(toggle.getAttribute("aria-expanded")).toBe("true");
	fireEvent.click(toggle);
	expect(screen.getByRole("button", {name: "Places 1/1 Expand group"})).toBe(
		toggle,
	);
	expect(toggle.getAttribute("aria-expanded")).toBe("false");
});

it("derives nested ranks in split mode with collapsible groups", () => {
	const {rerender} = render(
		<Provider store={store}>
			<HeadingsProvider enabled options={{baseLevel: 2}}>
				<SplitBaseLayerSwitcher {...props} collapsibleGroups />
			</HeadingsProvider>
		</Provider>,
	);
	expect(
		screen.getByRole("heading", {level: 2, name: "Datenebenen"}),
	).toBeTruthy();
	expect(
		screen.getByRole("heading", {level: 3, name: /^Places/}),
	).toBeTruthy();
	rerender(
		<Provider store={store}>
			<HeadingsProvider enabled options={{baseLevel: 2}}>
				<SplitBaseLayerSwitcher
					{...props}
					headlineAs="h4"
					collapsibleGroups
				/>
			</HeadingsProvider>
		</Provider>,
	);
	expect(
		screen.getByRole("heading", {level: 4, name: "Datenebenen"}),
	).toBeTruthy();
	expect(
		screen.getByRole("heading", {level: 5, name: /^Places/}),
	).toBeTruthy();
});

it("does not re-render its entries on dispatches that leave the layers unchanged", () => {
	type ViewState = {map: {layers: typeof layers; view: {zoom?: number}}};
	const initialState: ViewState = {map: {layers, view: {zoom: 12}}};
	const viewStore = configureStore({
		reducer: (
			state: ViewState = initialState,
			action: {type: string; zoom?: number},
		): ViewState =>
			action.type === "zoom"
				? {...state, map: {...state.map, view: {zoom: action.zoom}}}
				: state,
	});
	const renderEntry = vi.fn(props.renderEntry);
	render(
		<Provider store={viewStore}>
			<SplitBaseLayerSwitcher
				{...props}
				// A selector that builds a new array on every call, like the defaults.
				layerIdsSelector={(mapState: {layers: object}) =>
					Object.keys(mapState.layers)
				}
				renderEntry={renderEntry}
				collapsibleGroups
			/>
		</Provider>,
	);
	const initialRenders = renderEntry.mock.calls.length;

	act(() => {
		for (let zoom = 13; zoom < 18; zoom++) {
			viewStore.dispatch({type: "zoom", zoom});
		}
	});

	expect(renderEntry.mock.calls.length).toBe(initialRenders);
});
