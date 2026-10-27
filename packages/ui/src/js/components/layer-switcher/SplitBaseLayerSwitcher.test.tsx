import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, expect, it} from "vitest";

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
	expect(toggle.getAttribute("aria-expanded")).toBe("true");
	fireEvent.click(toggle);
	expect(screen.getByRole("button", {name: "Places 1/1 Expand group"})).toBe(
		toggle,
	);
	expect(toggle.getAttribute("aria-expanded")).toBe("false");
});
