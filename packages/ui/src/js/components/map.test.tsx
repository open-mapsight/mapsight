import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {setDocumentLanguage} from "../helpers/i18n";
import MapsightMap from "./map";

function store() {
	return Object.assign(configureStore({reducer: () => ({})}), {
		getController: () => ({mount: vi.fn(), unmount: vi.fn()}),
	});
}

afterEach(() => {
	cleanup();
	setDocumentLanguage("de");
});

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
		const usage = document.getElementById(
			map.getAttribute("aria-describedby")!,
		);
		expect(usage?.textContent).toContain("Shift+F10");
		expect(usage?.textContent).toContain("hineinzoomen");
		expect(usage?.textContent).toContain("verschieben");
	});

	it("supports host names and descriptions and per-instance usage ids", () => {
		render(
			<Provider store={store()}>
				<MapsightMap mapTitle="City map" aria-describedby="host-help" />
				<MapsightMap aria-label="Trail map" />
			</Provider>,
		);
		const city = screen.getByRole("region", {name: "City map"});
		const trail = screen.getByRole("region", {name: "Trail map"});
		expect(city.getAttribute("aria-describedby")).toContain("host-help");
		expect(city.getAttribute("aria-describedby")).not.toBe(
			trail.getAttribute("aria-describedby"),
		);
	});

	it("translates the name, role description and keyboard help", () => {
		setDocumentLanguage("en");
		render(
			<Provider store={store()}>
				<MapsightMap />
			</Provider>,
		);
		const map = screen.getByRole("region", {name: "Interactive map"});
		expect(map.getAttribute("aria-roledescription")).toBe("Map");
		expect(
			document.getElementById(map.getAttribute("aria-describedby")!)
				?.textContent,
		).toContain("Shift+F10");
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
