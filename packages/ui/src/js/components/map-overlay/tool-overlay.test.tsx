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

	it("closes on Escape without letting the key reach outer handlers", () => {
		const onClose = vi.fn();
		const outerKeyDown = vi.fn();
		document.addEventListener("keydown", outerKeyDown);

		render(
			<ToolOverlay
				label="Measure distance"
				text={null}
				onClose={onClose}
			/>,
		);

		fireEvent.keyDown(screen.getByRole("button"), {key: "Escape"});
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(outerKeyDown).not.toHaveBeenCalled();

		fireEvent.keyDown(screen.getByRole("button"), {key: "Enter"});
		expect(onClose).toHaveBeenCalledTimes(1);

		document.removeEventListener("keydown", outerKeyDown);
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
