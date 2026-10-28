import OlMap from "ol/Map";
import View from "ol/View";
import type LineString from "ol/geom/LineString";
import Draw from "ol/interaction/Draw";

import {afterEach, describe, expect, it, vi} from "vitest";

import {installKeyboardDrawing} from "./measure-distance";

const cleanups: Array<() => void> = [];
afterEach(() => {
	cleanups
		.splice(0)
		.reverse()
		.forEach((cleanup) => cleanup());
});

function fixture(type: "LineString" | "Point" = "LineString") {
	const target = document.createElement("div");
	target.tabIndex = 0;
	document.body.append(target);
	const draw = new Draw({type});
	draw.set("keyboardTool", "test");
	const map = new OlMap({
		target,
		view: new View({center: [100, 200], zoom: 10}),
		controls: [],
		interactions: [draw],
	});
	map.setSize([400, 400]);
	cleanups.push(() => {
		map.dispose();
		target.remove();
	});
	const key = (key: string, options: KeyboardEventInit = {}) => {
		const event = new KeyboardEvent("keydown", {
			key,
			bubbles: true,
			cancelable: true,
			...options,
		});
		target.dispatchEvent(event);
		return event;
	};
	return {map, draw, target, key};
}

describe("keyboard drawing", () => {
	it("adds centre points with Enter/Space, removes with Backspace and finishes with Enter after two points", () => {
		const {map, draw, target, key} = fixture();
		cleanups.push(installKeyboardDrawing(map, "test"));
		const finished = vi.fn();
		draw.on("drawend", (event) =>
			finished(
				(event.feature.getGeometry() as LineString).getCoordinates(),
			),
		);
		target.focus();
		expect(key("Enter").defaultPrevented).toBe(true);
		map.getView().setCenter([300, 400]);
		key(" ");
		key("Backspace");
		map.getView().setCenter([500, 600]);
		key("Enter");
		expect(finished).not.toHaveBeenCalled();
		key("Enter");
		expect(finished).toHaveBeenCalledExactlyOnceWith([
			[100, 200],
			[500, 600],
		]);
	});

	it("leaves arrow, modified, repeated, handled and child keys alone and requires target focus", () => {
		const {map, draw, target, key} = fixture();
		cleanups.push(installKeyboardDrawing(map, "test"));
		const append = vi.spyOn(draw, "appendCoordinates");
		key(" ");
		target.focus();
		expect(key("ArrowUp").defaultPrevented).toBe(false);
		key(" ", {ctrlKey: true});
		key("Enter", {repeat: true});
		const handled = new KeyboardEvent("keydown", {
			key: " ",
			cancelable: true,
		});
		handled.preventDefault();
		target.dispatchEvent(handled);
		const child = document.createElement("button");
		target.append(child);
		child.focus();
		child.dispatchEvent(
			new KeyboardEvent("keydown", {key: " ", bubbles: true}),
		);
		expect(append).not.toHaveBeenCalled();
	});

	it("stops when inactive, detaches on unmount and reattaches once on remount", () => {
		const {map, draw, target, key} = fixture();
		const stop = installKeyboardDrawing(map, "test");
		cleanups.push(stop);
		const append = vi.spyOn(draw, "appendCoordinates");
		target.focus();
		draw.setActive(false);
		expect(key(" ").defaultPrevented).toBe(false);
		draw.setActive(true);
		map.setTarget(undefined);
		key(" ");
		expect(append).not.toHaveBeenCalled();
		map.setTarget(target);
		key(" ");
		expect(append).toHaveBeenCalledTimes(1);
		stop();
		key(" ");
		expect(append).toHaveBeenCalledTimes(1);
	});

	it("adds and removes shared points with Enter, Space and Backspace", () => {
		const {map, target, key} = fixture("Point");
		const actions = {add: vi.fn(), remove: vi.fn()};
		cleanups.push(installKeyboardDrawing(map, "test", actions));
		target.focus();
		key("Enter");
		key(" ");
		key("Backspace");
		expect(actions.add).toHaveBeenCalledTimes(2);
		expect(actions.remove).toHaveBeenCalledTimes(1);
	});

	it("waits for a running pan, then applies queued keys in order at the settled centre", () => {
		const {map, draw, target, key} = fixture();
		cleanups.push(installKeyboardDrawing(map, "test"));
		const append = vi.spyOn(draw, "appendCoordinates");
		const removeLast = vi.spyOn(draw, "removeLastPoint");
		const view = map.getView();
		const start = Date.now();
		const now = vi.spyOn(Date, "now").mockReturnValue(start);
		cleanups.push(() => now.mockRestore());
		target.focus();
		view.animate({center: [500, 600], duration: 1000});
		expect(key(" ").defaultPrevented).toBe(true);
		key("Backspace");
		key(" ");
		expect(append).not.toHaveBeenCalled();
		now.mockReturnValue(start + 1000);
		view.updateAnimations_();
		expect(append.mock.calls).toEqual([[[[500, 600]]], [[[500, 600]]]]);
		expect(removeLast).toHaveBeenCalledTimes(1);
		expect(removeLast.mock.invocationCallOrder[0]).toBeGreaterThan(
			append.mock.invocationCallOrder[0]!,
		);
	});

	it("drops keys queued during a pan when the tool closes or unbinds", () => {
		const {map, draw, target, key} = fixture("Point");
		const actions = {add: vi.fn(), remove: vi.fn()};
		const stop = installKeyboardDrawing(map, "test", actions);
		const view = map.getView();
		target.focus();
		view.animate({center: [500, 600], duration: 1000});
		key("Enter");
		draw.setActive(false);
		view.cancelAnimations();
		expect(actions.add).not.toHaveBeenCalled();
		draw.setActive(true);
		view.animate({center: [700, 800], duration: 1000});
		key("Enter");
		stop();
		view.cancelAnimations();
		expect(actions.add).not.toHaveBeenCalled();
	});

	it("keeps a crosshair when another tool is inactive and hides it on blur", () => {
		const {map, draw, target} = fixture();
		const other = new Draw({type: "Point"});
		other.set("keyboardTool", "other");
		other.setActive(false);
		map.addInteraction(other);
		cleanups.push(installKeyboardDrawing(map, "test"));
		cleanups.push(installKeyboardDrawing(map, "other"));
		target.focus();
		expect(
			target.classList.contains("ms3-map-target--keyboard-drawing"),
		).toBe(true);
		draw.setActive(false);
		expect(
			target.classList.contains("ms3-map-target--keyboard-drawing"),
		).toBe(false);
		draw.setActive(true);
		target.blur();
		expect(
			target.classList.contains("ms3-map-target--keyboard-drawing"),
		).toBe(false);
	});
});
