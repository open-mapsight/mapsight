import type {ReactNode} from "react";
import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import type {View} from "../../config/constants/app";
import {
	VIEW_DESKTOP,
	VIEW_FULLSCREEN,
	VIEW_MAP_ONLY,
	VIEW_MOBILE,
} from "../../config/constants/app";
import {setDocumentLanguage} from "../../helpers/i18n";
import {SET_VIEW} from "../../store/actions";
import AppWrapper from "./wrapper";

vi.mock("../../helpers/announce-status", () => ({
	announceStatus: vi.fn(),
}));

type AppSlice = {
	view: View;
	embeddedMap?: boolean;
	map?: {show?: boolean};
};

function createStore(view: View) {
	return configureStore({
		reducer: {
			app: (state: AppSlice = {view, map: {show: true}}, action) => {
				if (action.type === SET_VIEW) {
					return {
						...state,
						view: (action as {value: View}).value,
					};
				}
				return state;
			},
		},
	});
}

function renderWrapper(view: View, ui?: ReactNode, outside?: HTMLElement) {
	const store = createStore(view);
	if (outside) {
		document.body.append(outside);
	}

	const result = render(
		<Provider store={store}>
			<AppWrapper>
				{ui ?? (
					<button type="button" data-testid="inside">
						inside
					</button>
				)}
			</AppWrapper>
		</Provider>,
	);

	return {store, ...result};
}

describe("AppWrapper overlay chrome", () => {
	beforeEach(() => {
		setDocumentLanguage("en");
	});

	afterEach(() => {
		cleanup();
		document.body.replaceChildren();
		setDocumentLanguage("de");
	});

	it("is a normal landmark-free container in desktop view", () => {
		renderWrapper(VIEW_DESKTOP);

		expect(screen.queryByRole("dialog")).toBeNull();
		expect(document.querySelector(".ms3-wrapper--desktop")).toBeTruthy();
	});

	it("exposes a named modal dialog in fullscreen and mapOnly", () => {
		const {unmount} = renderWrapper(VIEW_FULLSCREEN);
		const fullscreen = screen.getByRole("dialog", {name: "Fullscreen map"});
		expect(fullscreen.getAttribute("aria-modal")).toBe("true");
		expect(fullscreen.getAttribute("tabindex")).toBe("-1");
		expect(fullscreen.textContent).toContain("Press Escape to exit");
		unmount();

		renderWrapper(VIEW_MAP_ONLY);
		expect(screen.getByRole("dialog", {name: "Map"})).toBeTruthy();
	});

	it("inerts host-page siblings while overlay chrome is open", () => {
		const outside = document.createElement("button");
		outside.type = "button";
		outside.textContent = "host nav";
		renderWrapper(VIEW_FULLSCREEN, undefined, outside);

		expect(outside.hasAttribute("inert")).toBe(true);
		expect(screen.getByTestId("inside").hasAttribute("inert")).toBe(false);
	});

	it("leaves host siblings reachable in mobile view", () => {
		const outside = document.createElement("button");
		outside.type = "button";
		outside.textContent = "host nav";
		renderWrapper(VIEW_MOBILE, undefined, outside);

		expect(outside.hasAttribute("inert")).toBe(false);
	});

	it("exits fullscreen to desktop on Escape", () => {
		const {store} = renderWrapper(VIEW_FULLSCREEN);
		const dialog = screen.getByRole("dialog");

		fireEvent.keyDown(dialog, {key: "Escape"});

		expect(store.getState().app.view).toBe(VIEW_DESKTOP);
		expect(screen.queryByRole("dialog")).toBeNull();
	});

	it("exits mapOnly to mobile on Escape", () => {
		const {store} = renderWrapper(VIEW_MAP_ONLY);
		fireEvent.keyDown(screen.getByRole("dialog"), {key: "Escape"});
		expect(store.getState().app.view).toBe(VIEW_MOBILE);
	});

	it("does not exit overlay chrome when a nested platform modal is open", () => {
		const nested = document.createElement("dialog");
		nested.setAttribute("open", "");
		document.body.append(nested);

		const {store} = renderWrapper(VIEW_FULLSCREEN);
		fireEvent.keyDown(
			screen.getByRole("dialog", {name: "Fullscreen map"}),
			{key: "Escape"},
		);

		expect(store.getState().app.view).toBe(VIEW_FULLSCREEN);
	});

	it("keeps Tab inside the overlay chrome", () => {
		const outside = document.createElement("button");
		outside.type = "button";
		outside.textContent = "host nav";
		renderWrapper(
			VIEW_FULLSCREEN,
			<>
				<button type="button">first</button>
				<button type="button">last</button>
			</>,
			outside,
		);

		screen.getByRole("button", {name: "last"}).focus();
		fireEvent.keyDown(document, {key: "Tab"});

		expect(document.activeElement).not.toBe(outside);
		expect(
			screen.getByRole("dialog").contains(document.activeElement),
		).toBe(true);
	});
});
