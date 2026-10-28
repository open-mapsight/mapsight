import {FocusScope} from "react-aria";
import {Provider, useSelector} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {
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
	retain = false,
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
			<FocusScope>
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
					{(selected || retain) && (
						<FeatureSelectionInfo
							feature={feature}
							isOpen={selected}
							enableKeyboardControl={enableKeyboardControl}
						/>
					)}
					<button type="button">after details</button>
				</div>
			</FocusScope>
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
	it("focuses a named region with a sticky header and keeps heading ids unique", () => {
		setup({stickyHeader: true});
		const region = screen.getByRole("region", {name: "Place"});
		expect(document.activeElement).toBe(region);
		const id = region.getAttribute("aria-labelledby");
		expect(document.querySelectorAll(`[id="${id}"]`)).toHaveLength(1);
		expect(screen.getByRole("heading", {name: "Place"}).id).toBe(id);
	});

	it("traps focus only when trapFocus opts in", async () => {
		setup();
		const outside = screen.getByRole("button", {name: "after details"});
		outside.focus();
		expect(document.activeElement).toBe(outside);
		cleanup();
		setup({trapFocus: true});
		screen.getByRole("button", {name: "after details"}).focus();
		await waitFor(() =>
			expect(
				screen
					.getByRole("region", {name: "Place"})
					.contains(document.activeElement),
			).toBe(true),
		);
	});

	it("returns to the originating row after closing with Escape", async () => {
		const {origin, store} = setup();
		fireEvent.keyDown(screen.getByRole("region", {name: "Place"}), {
			key: "Escape",
		});
		expect(store.getState().selected).toBe(false);
		await waitFor(() => expect(document.activeElement).toBe(origin));
	});

	it("returns focus on button close without autofocus and keeps the closing snapshot inert", async () => {
		const {origin, container} = setup({
			enableKeyboardControl: false,
			retain: true,
		});
		expect(document.activeElement).toBe(origin);
		const close = screen.getByRole("button", {
			name: "Informationsdialog schließen",
		});
		close.focus();
		fireEvent.click(close);
		expect(
			container
				.querySelector(".ms3-feature-selection-info__wrapper")
				?.hasAttribute("inert"),
		).toBe(true);
		await waitFor(() => expect(document.activeElement).toBe(origin));
	});

	it("falls back to the first remaining control in the parent scope when the original row disappears", async () => {
		const {origin} = setup();
		origin.remove();
		fireEvent.click(
			screen.getByRole("button", {name: "Informationsdialog schließen"}),
		);
		await waitFor(() =>
			expect(document.activeElement).toBe(
				screen.getByRole("button", {name: "first row"}),
			),
		);
	});

	it("falls back to the map when the list is inert", async () => {
		setup();
		const list = document.querySelector<HTMLElement>(".ms3-list")!;
		list.inert = true;
		list.setAttribute("inert", "");
		fireEvent.click(
			screen.getByRole("button", {name: "Informationsdialog schließen"}),
		);
		await waitFor(() =>
			expect(document.activeElement).toBe(
				screen.getByRole("region", {name: "Map"}),
			),
		);
	});
});
