import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {announceStatus} from "../../helpers/announce-status";
import {setDocumentLanguage} from "../../helpers/i18n";
import {DEFAULT_MARKED_POINT_FEATURE_ID} from "../../plugins/browser/marked-point";
import MapPointContextMenu, {originNavHref} from "./map-point-context-menu";

vi.mock("ol/proj", () => ({
	toLonLat: (coordinate: number[]) => coordinate,
}));

vi.mock("../../helpers/announce-status", () => ({
	announceStatus: vi.fn(),
}));

function createStore(_mapTarget: HTMLElement) {
	return configureStore({
		reducer: {
			app: (state = {}) => state,
		},
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware({
				thunk: {
					extraArgument: {},
				},
			}),
	});
}

describe("MapPointContextMenu", () => {
	afterEach(() => {
		cleanup();
		setDocumentLanguage("de");
		vi.unstubAllGlobals();
	});

	it("drops the pin on right-click and then names it from nearest", async () => {
		const mapTarget = document.createElement("div");
		mapTarget.className = "ms3-map-target";
		mapTarget.tabIndex = 0;
		document.body.append(mapTarget);

		const store = createStore(mapTarget);
		(
			store as typeof store & {getController: (name: string) => unknown}
		).getController = () => ({
			getMap: () => ({
				getTargetElement: () => mapTarget,
				getEventCoordinate: () => [10.52, 52.26],
				getPixelFromCoordinate: () => [40, 50],
				getView: () => ({
					getCenter: () => [10.52, 52.26],
				}),
			}),
		});

		const dispatch = vi.spyOn(store, "dispatch");
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve([
						{
							name: "Bohlweg",
							nummer: "1",
							plz: "38100",
							ort: "Braunschweig",
						},
					]),
			}),
		);

		render(
			<Provider store={store}>
				<MapPointContextMenu
					pluginName="sharePositionLink"
					nearestUrl="/mapsight/geo-search/nearest.php"
				/>
			</Provider>,
		);

		fireEvent.contextMenu(mapTarget, {clientX: 40, clientY: 50});

		expect(
			screen.getByRole("menuitem", {name: "Koordinaten kopieren"}),
		).toBeTruthy();
		expect(screen.getByRole("menuitem", {name: "Von hier…"})).toBeTruthy();
		expect(screen.getByRole("menuitem", {name: "Nach hier…"})).toBeTruthy();
		expect(
			screen.queryByRole("menuitem", {name: "Google Maps"}),
		).toBeNull();

		const thunks = dispatch.mock.calls
			.map(([action]) => action)
			.filter((action) => typeof action === "function");
		expect(thunks.length).toBeGreaterThan(0);

		await vi.waitFor(() => {
			expect(
				dispatch.mock.calls.filter(
					([action]) => typeof action === "function",
				).length,
			).toBeGreaterThan(1);
		});

		mapTarget.remove();
	});

	it("writes the shared point as soon as the menu opens", () => {
		const mapTarget = document.createElement("div");
		mapTarget.className = "ms3-map-target";
		mapTarget.tabIndex = 0;
		document.body.append(mapTarget);

		const store = createStore(mapTarget);
		(
			store as typeof store & {getController: (name: string) => unknown}
		).getController = () => ({
			getMap: () => ({
				getTargetElement: () => mapTarget,
				getEventCoordinate: () => [10.52, 52.26],
				getPixelFromCoordinate: () => [40, 50],
				getView: () => ({
					getCenter: () => [10.52, 52.26],
				}),
			}),
		});

		const dispatch = vi.spyOn(store, "dispatch");

		render(
			<Provider store={store}>
				<MapPointContextMenu pluginName="sharePositionLink" />
			</Provider>,
		);

		fireEvent.contextMenu(mapTarget, {clientX: 40, clientY: 50});

		expect(
			screen.getByRole("menuitem", {name: "Koordinaten kopieren"}),
		).toBeTruthy();

		const thunks = dispatch.mock.calls
			.map(([action]) => action)
			.filter((action) => typeof action === "function");
		expect(thunks.length).toBeGreaterThan(0);

		const inner: unknown[] = [];
		const innerDispatch = vi.fn((action: unknown) => {
			if (typeof action === "function") {
				return action(innerDispatch);
			}
			inner.push(action);
			return action;
		});
		(thunks[0] as (dispatch: typeof innerDispatch) => unknown)(
			innerDispatch,
		);

		expect(
			inner.some(
				(action) =>
					typeof action === "object" &&
					action !== null &&
					"type" in action &&
					action.type ===
						"MAPSIGHT_FEATURE_SELECTIONS_SELECT_EXCLUSIVELY",
			) ||
				inner.some((action) =>
					JSON.stringify(action).includes(
						DEFAULT_MARKED_POINT_FEATURE_ID,
					),
				),
		).toBe(true);

		mapTarget.remove();
	});

	it("does not announce copy success when the clipboard rejects", async () => {
		const mapTarget = document.createElement("div");
		mapTarget.className = "ms3-map-target";
		document.body.append(mapTarget);

		const store = createStore(mapTarget);
		(
			store as typeof store & {getController: (name: string) => unknown}
		).getController = () => ({
			getMap: () => ({
				getTargetElement: () => mapTarget,
				getEventCoordinate: () => [10.52, 52.26],
				getPixelFromCoordinate: () => [40, 50],
				getView: () => ({getCenter: () => [10.52, 52.26]}),
			}),
		});

		const writeText = vi.fn().mockRejectedValue(new Error("denied"));
		vi.stubGlobal("navigator", {
			...window.navigator,
			clipboard: {writeText},
		});

		render(
			<Provider store={store}>
				<MapPointContextMenu />
			</Provider>,
		);

		fireEvent.contextMenu(mapTarget, {clientX: 40, clientY: 50});
		fireEvent.click(
			screen.getByRole("menuitem", {name: "Koordinaten kopieren"}),
		);

		await vi.waitFor(() => {
			expect(writeText).toHaveBeenCalled();
		});
		expect(announceStatus).not.toHaveBeenCalledWith("Koordinaten kopiert");

		mapTarget.remove();
	});

	it("builds origin URLs for from-here", () => {
		expect(originNavHref("google", 10.52, 52.26)).toBe(
			"https://www.google.com/maps/dir/?api=1&origin=52.26,10.52",
		);
		expect(originNavHref("apple", 10.52, 52.26)).toBe(
			"https://maps.apple.com/?saddr=52.26,10.52",
		);
		expect(originNavHref("osmand", 10.52, 52.26)).toBeNull();
	});

	it("moves the pin when right-clicking the map while the menu is open", () => {
		const mapTarget = document.createElement("div");
		mapTarget.className = "ms3-map-target";
		mapTarget.getBoundingClientRect = () => ({
			left: 0,
			top: 0,
			right: 400,
			bottom: 400,
			width: 400,
			height: 400,
			x: 0,
			y: 0,
			toJSON() {
				return {};
			},
		});
		document.body.append(mapTarget);

		const store = createStore(mapTarget);
		(
			store as typeof store & {getController: (name: string) => unknown}
		).getController = () => ({
			getMap: () => ({
				getTargetElement: () => mapTarget,
				getEventCoordinate: () => [10.52, 52.26],
				getPixelFromCoordinate: () => [40, 50],
				getView: () => ({getCenter: () => [10.52, 52.26]}),
			}),
		});

		render(
			<Provider store={store}>
				<MapPointContextMenu />
			</Provider>,
		);

		fireEvent.contextMenu(mapTarget, {clientX: 40, clientY: 50});
		expect(screen.getByRole("menu")).toBeTruthy();

		const overlay = document.createElement("div");
		overlay.dataset.testid = "underlay";
		document.body.append(overlay);
		fireEvent.contextMenu(overlay, {clientX: 180, clientY: 90, button: 2});

		expect(screen.getByRole("menu")).toBeTruthy();
		expect(
			document.querySelector(".ms3-map-point-menu__anchor"),
		).toHaveProperty("style.left", "196px");

		overlay.remove();
		mapTarget.remove();
	});

	it("does not open when right-clicking an overlay control over the map", () => {
		const mapTarget = document.createElement("div");
		mapTarget.className = "ms3-map-target";
		mapTarget.getBoundingClientRect = () => ({
			left: 0,
			top: 0,
			right: 400,
			bottom: 400,
			width: 400,
			height: 400,
			x: 0,
			y: 0,
			toJSON() {
				return {};
			},
		});
		document.body.append(mapTarget);

		const store = createStore(mapTarget);
		(
			store as typeof store & {getController: (name: string) => unknown}
		).getController = () => ({
			getMap: () => ({
				getTargetElement: () => mapTarget,
				getEventCoordinate: () => [10.52, 52.26],
				getPixelFromCoordinate: () => [40, 50],
				getView: () => ({getCenter: () => [10.52, 52.26]}),
			}),
		});

		render(
			<Provider store={store}>
				<MapPointContextMenu />
			</Provider>,
		);

		const zoom = document.createElement("button");
		zoom.className = "ms3-map-overlay__button";
		document.body.append(zoom);
		fireEvent.contextMenu(zoom, {clientX: 40, clientY: 50, button: 2});

		expect(screen.queryByRole("menu")).toBeNull();
		zoom.remove();
		mapTarget.remove();
	});

	it("ignores a context menu after the pointer dragged", () => {
		const mapTarget = document.createElement("div");
		document.body.append(mapTarget);

		const store = createStore(mapTarget);
		(
			store as typeof store & {getController: (name: string) => unknown}
		).getController = () => ({
			getMap: () => ({
				getTargetElement: () => mapTarget,
				getEventCoordinate: () => [10.52, 52.26],
				getPixelFromCoordinate: () => [40, 50],
				getView: () => ({getCenter: () => [10.52, 52.26]}),
			}),
		});

		render(
			<Provider store={store}>
				<MapPointContextMenu />
			</Provider>,
		);

		fireEvent.pointerDown(mapTarget, {clientX: 10, clientY: 20});
		fireEvent.contextMenu(mapTarget, {clientX: 80, clientY: 20});

		expect(screen.queryByRole("menu")).toBeNull();
		mapTarget.remove();
	});
});
