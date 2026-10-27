import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {registerTranslations, setDocumentLanguage} from "../../helpers/i18n";
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

	it("respects child preventDefault and nested dialogs", () => {
		const onClose = vi.fn();
		render(
			<ToolOverlay label="Tool" text="" onClose={onClose}>
				<input
					aria-label="handled"
					onKeyDown={(event) => event.preventDefault()}
				/>
				<dialog open>
					<input aria-label="dialog" />
				</dialog>
			</ToolOverlay>,
		);
		fireEvent.keyDown(screen.getByRole("textbox", {name: "handled"}), {
			key: "Escape",
		});
		fireEvent.keyDown(screen.getByRole("textbox", {name: "dialog"}), {
			key: "Escape",
		});
		expect(onClose).not.toHaveBeenCalled();
	});
});
