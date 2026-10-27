import OlMap from "ol/Map";
import View from "ol/View";
import type LineString from "ol/geom/LineString";
import Draw from "ol/interaction/Draw";

import {afterEach, describe, expect, it, vi} from "vitest";

import type {MapController} from "@mapsight/core/lib/map/controller";
import DrawDefinition from "@mapsight/core/ol-proxy/definitions/interaction/DrawInteraction";

import {create} from "../../index";
import createMeasureDistancePlugin, {
	finishKeyboardMeasurement,
	getKeyboardDraw,
	installKeyboardDrawing,
	keyboardDrawingDefinition,
} from "./measure-distance";

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
	it("uses the current centre, removes the last vertex and finishes with Enter", () => {
		const {map, draw, target, key} = fixture();
		cleanups.push(installKeyboardDrawing(map, "test"));
		const finished = vi.fn();
		draw.on("drawend", (event) =>
			finished(
				(event.feature.getGeometry() as LineString).getCoordinates(),
			),
		);
		target.focus();
		expect(
			target.classList.contains("ms3-map-target--keyboard-drawing"),
		).toBe(true);
		expect(key("Enter").defaultPrevented).toBe(true);
		map.getView().setCenter([300, 400]);
		key(" ");
		key("Backspace");
		map.getView().setCenter([500, 600]);
		key(" ");
		key("Enter");
		expect(finished).toHaveBeenCalledExactlyOnceWith([
			[100, 200],
			[500, 600],
		]);
	});

	it("does not finish a one-point line and supports the Done command", () => {
		const {map, draw, target, key} = fixture();
		cleanups.push(installKeyboardDrawing(map, "test"));
		const finished = vi.fn();
		draw.on("drawend", finished);
		target.focus();
		key(" ");
		finishKeyboardMeasurement(map, "test");
		expect(finished).not.toHaveBeenCalled();
		map.getView().setCenter([300, 400]);
		key(" ");
		finishKeyboardMeasurement(map, "test");
		expect(finished).toHaveBeenCalledTimes(1);
	});

	it("leaves arrow/zoom/modified/repeated/handled keys alone and requires target focus", () => {
		const {map, draw, target, key} = fixture();
		cleanups.push(installKeyboardDrawing(map, "test"));
		const append = vi.spyOn(draw, "appendCoordinates");
		key(" ");
		target.focus();
		for (const name of ["ArrowUp", "ArrowDown", "+", "-", "F10", "Escape"])
			expect(key(name).defaultPrevented).toBe(false);
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

	it("detaches on unmount, reattaches once on remount, and stops when inactive", () => {
		const {map, draw, target, key} = fixture();
		const stop = installKeyboardDrawing(map, "test");
		cleanups.push(stop);
		const append = vi.spyOn(draw, "appendCoordinates");
		target.focus();
		draw.setActive(false);
		expect(
			target.classList.contains("ms3-map-target--keyboard-drawing"),
		).toBe(false);
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
		const {map, draw, target, key} = fixture("Point");
		const actions = {add: vi.fn(), remove: vi.fn()};
		cleanups.push(installKeyboardDrawing(map, "test", actions));
		target.focus();
		key("Enter");
		key(" ");
		key("Backspace");
		expect(actions.add).toHaveBeenCalledTimes(2);
		expect(actions.remove).toHaveBeenCalledTimes(1);
		expect(getKeyboardDraw(map, "test")).toBe(draw);
		expect(getKeyboardDraw(map, "other")).toBeUndefined();
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

	it.each([undefined, true, false])(
		"supports keyboardDrawing=%s (default false)",
		(keyboardDrawing) => {
			const context = create(
				null,
				vi.fn(),
				{map: {layers: {}}},
				{
					renderer: vi.fn(),
					validateConfig: false,
					plugins: [
						[
							"measure",
							createMeasureDistancePlugin({keyboardDrawing}),
						],
					],
				},
			);
			const map = (
				context.store!.getController("map") as MapController
			).getMap()!;
			cleanups.push(() => map.dispose());
			expect(!!getKeyboardDraw(map, "measureDistance")).toBe(
				keyboardDrawing === true,
			);
		},
	);

	it("preserves custom definition behaviour and event names", () => {
		const definition = keyboardDrawingDefinition(DrawDefinition);
		expect(definition.Constructor).toBe(DrawDefinition.Constructor);
		expect(definition.type).toBe(DrawDefinition.type);
		expect(definition.optionMap.source).toBe(
			DrawDefinition.optionMap.source,
		);
		expect(definition.optionMap.keyboardTool).toBe("__set__");
	});
});
