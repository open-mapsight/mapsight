import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import MapsightMap from "./map";

function store() {
	return Object.assign(configureStore({reducer: () => ({})}), {
		getController: () => ({mount: vi.fn(), unmount: vi.fn()}),
	});
}

afterEach(cleanup);

describe("map accessibility", () => {
	it("names and describes the keyboard focus target", () => {
		render(
			<Provider store={store()}>
				<MapsightMap />
			</Provider>,
		);
		const map = screen.getByRole("region", {name: "Interaktive Karte"});
		expect(map.tabIndex).toBe(0);
		expect(map.getAttribute("aria-roledescription")).toBe("Karte");
		expect(
			document.getElementById(map.getAttribute("aria-describedby")!)
				?.textContent,
		).toContain("Shift+F10");
	});

	it("accepts host names and descriptions", () => {
		render(
			<Provider store={store()}>
				<MapsightMap mapTitle="City map" aria-describedby="host-help" />
				<MapsightMap aria-label="Trail map" />
			</Provider>,
		);
		expect(
			screen
				.getByRole("region", {name: "City map"})
				.getAttribute("aria-describedby"),
		).toContain("host-help");
		screen.getByRole("region", {name: "Trail map"});
	});

	it("does not add keyboard instructions or a tab stop when keyboard control is disabled", () => {
		render(
			<Provider store={store()}>
				<MapsightMap enableKeyboardControl={false} />
			</Provider>,
		);
		const map = screen.getByRole("region", {name: "Interaktive Karte"});
		expect(map.tabIndex).toBe(-1);
		expect(map.hasAttribute("aria-describedby")).toBe(false);
	});
});
