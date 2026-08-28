import {describe, expect, it} from "vitest";

import type {LayerState} from "@/lib/map/types";

import {syncDependentLayerVisibility} from "./syncDependentLayerVisibility";

function tileLayer(
	visible: boolean,
	visibleWhenLayerIds?: string[],
): LayerState {
	return {
		type: "TileLayer",
		metaData: visibleWhenLayerIds ? {visibleWhenLayerIds} : {},
		options: {visible},
	};
}

describe("syncDependentLayerVisibility", () => {
	it("shows a dependent layer only when every required layer is visible", () => {
		const layers = {
			base: tileLayer(true),
			theme: tileLayer(true),
			companion: tileLayer(false, ["base", "theme"]),
		};

		const next = syncDependentLayerVisibility(layers);

		expect(next.companion?.options?.visible).toBe(true);
		expect(next).not.toBe(layers);
	});

	it("hides a dependent layer when any required layer is off", () => {
		const layers = {
			base: tileLayer(true),
			theme: tileLayer(false),
			companion: tileLayer(true, ["base", "theme"]),
		};

		expect(
			syncDependentLayerVisibility(layers).companion?.options?.visible,
		).toBe(false);
	});

	it("treats a missing required layer as not visible", () => {
		const layers = {
			base: tileLayer(true),
			companion: tileLayer(true, ["base", "theme"]),
		};

		expect(
			syncDependentLayerVisibility(layers).companion?.options?.visible,
		).toBe(false);
	});

	it("returns the same object when nothing changes", () => {
		const layers = {
			base: tileLayer(true),
			theme: tileLayer(true),
			companion: tileLayer(true, ["base", "theme"]),
			markers: tileLayer(true),
		};

		expect(syncDependentLayerVisibility(layers)).toBe(layers);
	});

	it("leaves layers without visibleWhenLayerIds unchanged", () => {
		const layers = {
			base: tileLayer(true),
			other: tileLayer(false),
		};

		expect(syncDependentLayerVisibility(layers)).toBe(layers);
	});
});
