import {describe, expect, it, vi} from "vitest";

import {DEFAULT_CORE_PROPERTY_KEYS} from "@mapsight/lib-ol/feature/defaultCorePropertyKeys";
import type {MapsightStyleFunction} from "@mapsight/lib-ol/style/styleFunction";

import {MapController} from "@/lib/map/controller";
import type {MapState} from "@/lib/map/types";
import type {EnhancedStore} from "@/types";

import FeatureSourceConnector from "./VectorFeatureSource/FeatureSourceConnector";
import VectorFeatureSource from "./VectorFeatureSource/VectorFeatureSource";

describe("WithStyleFunction core property keys", () => {
	it("keeps the default set when the style function has no allowedProps", () => {
		const controller = new MapController("map");
		const styleFunction: MapsightStyleFunction = () => undefined;

		controller.setStyleFunction(styleFunction);

		expect(controller.getCorePropertyKeys()).toBe(
			DEFAULT_CORE_PROPERTY_KEYS,
		);
	});

	it("does not copy every key when allowedProps is false", () => {
		const controller = new MapController("map");
		const styleFunction: MapsightStyleFunction = () => undefined;
		styleFunction.allowedProps = false;

		controller.setStyleFunction(styleFunction);

		expect(controller.getCorePropertyKeys()).toBe(
			DEFAULT_CORE_PROPERTY_KEYS,
		);
		expect(controller.getCorePropertyKeys().has("tagGroups")).toBe(false);
	});

	it("unions compiled allowedProps with the default set", () => {
		const controller = new MapController("map");
		const styleFunction: MapsightStyleFunction = () => undefined;
		styleFunction.allowedProps = ["myHostKey"];

		controller.setStyleFunction(styleFunction);

		const keys = controller.getCorePropertyKeys();
		expect(keys.has("myHostKey")).toBe(true);
		expect(keys.has("markerCaption")).toBe(true);
		expect(keys.has("tagGroups")).toBe(false);
	});

	it("notifies listeners when a later style adds compiled allowedProps", () => {
		const controller = new MapController("map");
		const listener = vi.fn();
		controller.onCorePropertyKeysChange(listener);

		const first: MapsightStyleFunction = () => undefined;
		controller.setStyleFunction(first);
		expect(listener).not.toHaveBeenCalled();

		const next: MapsightStyleFunction = () => undefined;
		next.allowedProps = ["myHostKey"];
		controller.setStyleFunction(next);

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener.mock.calls[0]?.[0].has("myHostKey")).toBe(true);

		controller.setStyleFunction(next);
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("pushes a later allowlist to an already-wired feature source", () => {
		const setKeys = vi.spyOn(
			FeatureSourceConnector.prototype,
			"setCorePropertyKeys",
		);
		const controller = new MapController("map");
		controller.bindToStore({
			getState: () => ({layers: {}, size: [0, 0]}),
			subscribe: () => () => {},
			dispatch: () => undefined,
			getController: () => undefined,
		} as unknown as EnhancedStore<MapState>);

		const source = new VectorFeatureSource({
			canAnimate: false,
			canCluster: false,
		});
		source.setMapController(controller);
		const afterWire = setKeys.mock.calls.length;

		const styleFunction: MapsightStyleFunction = () => undefined;
		styleFunction.allowedProps = ["myHostKey"];
		controller.setStyleFunction(styleFunction);

		expect(setKeys.mock.calls.length).toBeGreaterThan(afterWire);
		const lastKeys = setKeys.mock.calls.at(-1)?.[0];
		expect(lastKeys?.has("myHostKey")).toBe(true);

		setKeys.mockRestore();
		source.dispose();
	});
});
