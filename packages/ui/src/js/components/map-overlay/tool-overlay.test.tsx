import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {VIEW_DESKTOP, VIEW_FULLSCREEN} from "../../config/constants/app";
import {registerTranslations, setDocumentLanguage} from "../../helpers/i18n";
import {SET_VIEW} from "../../store/actions";
import AppWrapper from "../layout/wrapper";
import MeasureDistanceButton from "./measure-distance-button";
import ToolOverlay from "./tool-overlay";

afterEach(() => {
	cleanup();
	setDocumentLanguage("de");
});

describe("ToolOverlay", () => {
	it("is a region named by its heading", () => {
		render(
			<ToolOverlay
				label="Measure distance"
				text="Click the map"
				onClose={vi.fn()}
			>
				<span>result</span>
			</ToolOverlay>,
		);

		const region = screen.getByRole("region", {name: "Measure distance"});
		expect(region.textContent).toContain("Click the map");
		expect(region.textContent).toContain("result");
	});
});

describe("MeasureDistanceButton", () => {
	it("exposes the overlay state on its toggle and returns focus on Escape", () => {
		setDocumentLanguage("en");
		registerTranslations({
			en: {"ui.measure-distance.title": "Measure distance"},
		});
		const store = configureStore({
			reducer: {
				map: (state = {}) => state,
				featureSources: (state = {}) => state,
			},
		});

		render(
			<Provider store={store}>
				<MeasureDistanceButton />
			</Provider>,
		);

		const toggle = screen.getByRole("button", {name: "Measure distance"});
		expect(toggle.getAttribute("aria-expanded")).toBe("false");
		expect(toggle.hasAttribute("aria-controls")).toBe(false);

		fireEvent.click(toggle);

		const region = screen.getByRole("region", {name: "Measure distance"});
		expect(toggle.getAttribute("aria-expanded")).toBe("true");
		expect(toggle.getAttribute("aria-controls")).toBe(region.id);

		const closeButton = screen.getByRole("button", {name: "close"});
		closeButton.focus();
		fireEvent.keyDown(closeButton, {key: "Escape"});

		expect(screen.queryByRole("region")).toBeNull();
		expect(toggle.getAttribute("aria-expanded")).toBe("false");
		expect(document.activeElement).toBe(toggle);
	});
});

describe("ToolOverlay Escape", () => {
	it("closes only for Escape inside the tool and lets the event bubble", () => {
		const onClose = vi.fn();
		const onKeyDown = vi.fn();
		render(
			<div onKeyDown={onKeyDown} role="presentation">
				<button type="button">outside</button>
				<ToolOverlay label="Tool" text="Instructions" onClose={onClose}>
					<button type="button">inside</button>
				</ToolOverlay>
			</div>,
		);
		fireEvent.keyDown(screen.getByRole("button", {name: "outside"}), {
			key: "Escape",
		});
		expect(onClose).not.toHaveBeenCalled();
		fireEvent.keyDown(screen.getByRole("button", {name: "inside"}), {
			key: "Escape",
		});
		expect(onClose).toHaveBeenCalledOnce();
		expect(onKeyDown).toHaveBeenCalledTimes(2);
		expect(onKeyDown.mock.calls[1]![0].defaultPrevented).toBe(true);
	});

	it("dismisses from the map or toggle before fullscreen handles Escape", () => {
		const onClose = vi.fn();
		const store = configureStore({
			reducer: {
				app: (
					state = {view: VIEW_FULLSCREEN, map: {show: true}},
					action,
				) =>
					action.type === SET_VIEW
						? {...state, view: (action as {value: string}).value}
						: state,
			},
		});
		render(
			<Provider store={store}>
				<AppWrapper>
					<div className="ms3-map-target" data-testid="map" />
					<button type="button" aria-controls="tool">
						toggle
					</button>
					<input aria-label="search" />
					<ToolOverlay
						id="tool"
						label="Tool"
						text=""
						onClose={onClose}
					/>
				</AppWrapper>
			</Provider>,
		);
		fireEvent.keyDown(screen.getByTestId("map"), {key: "Escape"});
		expect(onClose).toHaveBeenCalledOnce();
		expect(store.getState().app.view).toBe(VIEW_FULLSCREEN);
		fireEvent.keyDown(screen.getByRole("button", {name: "toggle"}), {
			key: "Escape",
		});
		expect(onClose).toHaveBeenCalledTimes(2);
		expect(store.getState().app.view).toBe(VIEW_FULLSCREEN);
		fireEvent.keyDown(screen.getByRole("textbox", {name: "search"}), {
			key: "Escape",
		});
		expect(onClose).toHaveBeenCalledTimes(2);
		expect(store.getState().app.view).toBe(VIEW_DESKTOP);
	});
});
