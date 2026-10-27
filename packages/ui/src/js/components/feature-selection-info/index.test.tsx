import {Provider, useSelector} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {setDocumentLanguage} from "../../helpers/i18n";
import FeatureSelectionInfo from "./index";

vi.mock("../feature-details-content", () => ({
	default: () => <a href="#details">More</a>,
}));

const feature = {
	id: "place",
	type: "Feature" as const,
	geometry: null,
	properties: {name: "Place"},
};

function setup({
	stickyHeader = false,
	trapFocus = false,
	enableKeyboardControl = true,
} = {}) {
	const store = configureStore({
		reducer: (
			state = {
				selected: false,
				app: {featureSelectionInfo: {stickyHeader, trapFocus}},
			},
			action,
		) =>
			action.type === "select"
				? {...state, selected: true}
				: action.type.includes("REMOVE")
					? {...state, selected: false}
					: state,
	});
	function Contents() {
		const selected = useSelector(
			(state: ReturnType<typeof store.getState>) => state.selected,
		);
		return (
			<div className="ms3-wrapper">
				<div className="ms3-list">
					<button type="button">first row</button>
					<button
						type="button"
						onClick={() => store.dispatch({type: "select"})}
					>
						origin row
					</button>
				</div>
				<div
					className="ms3-map-target"
					tabIndex={-1}
					role="region"
					aria-label="Map"
				/>
				{selected && (
					<FeatureSelectionInfo
						feature={feature}
						enableKeyboardControl={enableKeyboardControl}
					/>
				)}
				<button type="button">after details</button>
			</div>
		);
	}
	const result = render(
		<Provider store={store}>
			<Contents />
		</Provider>,
	);
	const origin = screen.getByRole("button", {name: "origin row"});
	origin.focus();
	fireEvent.click(origin);
	return {origin, store, ...result};
}

afterEach(() => {
	cleanup();
	setDocumentLanguage("de");
});

describe("selection details focus", () => {
	it.each([false, true])(
		"focuses a named region with stickyHeader=%s and keeps heading ids unique",
		(stickyHeader) => {
			setup({stickyHeader});
			const region = screen.getByRole("region", {name: "Place"});
			expect(document.activeElement).toBe(region);
			const id = region.getAttribute("aria-labelledby");
			expect(document.querySelectorAll(`[id="${id}"]`)).toHaveLength(1);
			expect(screen.getByRole("heading", {name: "Place"}).id).toBe(id);
		},
	);

	it("leaves focus free to move outside the non-modal region by default", () => {
		setup();
		const outside = screen.getByRole("button", {name: "after details"});
		outside.focus();
		expect(document.activeElement).toBe(outside);
	});

	it.each(["button", "Escape"])(
		"returns to the originating row after closing with %s",
		async (method) => {
			const {origin, store} = setup();
			const close = screen.getByRole("button", {
				name: "Informationsdialog schließen",
			});
			close.focus();
			if (method === "button") fireEvent.click(close);
			else fireEvent.keyDown(close, {key: "Escape"});
			expect(store.getState().selected).toBe(false);
			await waitFor(() => expect(document.activeElement).toBe(origin));
		},
	);

	it("returns focus on button close even when the host disables autofocus", async () => {
		const {origin} = setup({enableKeyboardControl: false});
		expect(document.activeElement).toBe(origin);
		const close = screen.getByRole("button", {
			name: "Informationsdialog schließen",
		});
		close.focus();
		fireEvent.click(close);
		await waitFor(() => expect(document.activeElement).toBe(origin));
	});

	it("falls back to the list when the original row disappears", async () => {
		const {origin} = setup();
		origin.remove();
		fireEvent.click(
			screen.getByRole("button", {name: "Informationsdialog schließen"}),
		);
		await waitFor(() =>
			expect(document.activeElement).toBe(
				document.querySelector(".ms3-list"),
			),
		);
	});

	it("falls back to the map when the list is inert", async () => {
		setup();
		document.querySelector(".ms3-list")!.setAttribute("inert", "");
		fireEvent.click(
			screen.getByRole("button", {name: "Informationsdialog schließen"}),
		);
		await waitFor(() =>
			expect(document.activeElement).toBe(
				screen.getByRole("region", {name: "Map"}),
			),
		);
	});

	it("does not dismiss for a nested dialog's Escape or an already handled Escape", () => {
		const {store} = setup();
		const region = screen.getByRole("region", {name: "Place"});
		const dialog = document.createElement("dialog");
		dialog.open = true;
		const input = document.createElement("input");
		dialog.append(input);
		region.append(dialog);
		fireEvent.keyDown(input, {key: "Escape"});
		const event = new KeyboardEvent("keydown", {
			key: "Escape",
			bubbles: true,
			cancelable: true,
		});
		event.preventDefault();
		fireEvent(region, event);
		expect(store.getState().selected).toBe(true);
	});

	it("allows focus trapping to be explicitly enabled", async () => {
		const {store} = setup({trapFocus: true});
		screen.getByRole("button", {name: "after details"}).focus();
		expect(
			screen
				.getByRole("region", {name: "Place"})
				.contains(document.activeElement),
		).toBe(true);
		fireEvent.keyDown(document.activeElement!, {key: "Escape"});
		expect(store.getState().selected).toBe(false);
		await act(async () => {
			await new Promise((resolve) => requestAnimationFrame(resolve));
		});
	});
});
