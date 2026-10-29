import {Provider} from "react-redux";

import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, expect, it, vi} from "vitest";

import type {MapController} from "@mapsight/core/lib/map/controller";

import {create} from "../../index";
import AppWrapper from "./wrapper";

const disposers: Array<() => void> = [];
afterEach(() => {
	cleanup();
	disposers.splice(0).forEach((dispose) => dispose());
});

function setup(skipLinks?: boolean, keyboardMap = true) {
	const {store} = create(
		null,
		vi.fn(),
		{map: {layers: {}}},
		{
			renderer: vi.fn(),
			validateConfig: false,
			uiState: skipLinks === undefined ? {} : {skipLinks},
		},
	);
	disposers.push(() =>
		(store!.getController("map") as MapController).getMap()?.dispose(),
	);
	render(
		<Provider store={store!}>
			<AppWrapper>
				{/* Like MapsightMap: a region that is focusable with keyboard control. */}
				<div
					className="ms3-map-target"
					role="region"
					aria-label="Karte"
					{...(keyboardMap ? {tabIndex: 0} : {})}
				/>
				<div className="ms3-search">
					<input type="search" aria-label="Suche" />
				</div>
				<section className="ms3-list-wrapper">
					<button type="button">Eintrag</button>
				</section>
			</AppWrapper>
		</Provider>,
	);
}

it("renders skip links by default and supports an explicit opt-out", () => {
	setup();
	expect(screen.getAllByRole("button", {name: /springen$/})).toHaveLength(3);
	cleanup();
	setup(false);
	expect(screen.queryByRole("button", {name: /springen$/})).toBeNull();
});

it("jumps to the map, list and search first in the instance", () => {
	setup(true);
	const links = screen.getAllByRole("button", {name: /springen$/});
	expect(links.map((link) => link.textContent)).toEqual([
		"Zur Karte springen",
		"Zur Liste springen",
		"Zur Suche springen",
	]);
	// They come before everything else in the instance's tab order.
	expect(document.querySelector(".ms3-wrapper button")).toBe(links[0]);

	fireEvent.click(links[0]!);
	expect(document.activeElement).toBe(
		document.querySelector(".ms3-map-target"),
	);
	fireEvent.click(links[1]!);
	const list = document.querySelector<HTMLElement>(".ms3-list-wrapper")!;
	expect(document.activeElement).toBe(list);
	expect(list.getAttribute("tabindex")).toBe("-1");
	fireEvent.click(links[2]!);
	expect(document.activeElement).toBe(screen.getByRole("searchbox"));
});

it("leaves out a map that is not keyboard-operable", () => {
	setup(true, false);
	expect(
		screen.queryByRole("button", {name: "Zur Karte springen"}),
	).toBeNull();
	expect(
		screen.getByRole("button", {name: "Zur Liste springen"}),
	).toBeTruthy();
});
