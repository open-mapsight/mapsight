import {describe, expect, it} from "vitest";

import {DEFAULT_CORE_PROPERTY_KEYS} from "@mapsight/lib-ol/feature/defaultCorePropertyKeys";
import type {MapsightStyleFunction} from "@mapsight/lib-ol/style/styleFunction";

import {MapController} from "@/lib/map/controller";

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
});
