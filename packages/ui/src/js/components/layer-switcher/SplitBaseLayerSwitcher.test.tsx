import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, expect, it} from "vitest";

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

it("supports section and nested group heading levels, defaulting to contextual h2/h3", () => {
	const {rerender} = render(
		<Provider store={store}>
			<SplitBaseLayerSwitcher {...props} />
		</Provider>,
	);
	expect(
		screen.getByRole("heading", {level: 2, name: "Basiskarte"}),
	).toBeTruthy();
	expect(
		screen.getByRole("heading", {level: 3, name: "Places"}),
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
			<HeadingsProvider options={{baseLevel: 2}}>
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
			<HeadingsProvider options={{baseLevel: 2}}>
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
