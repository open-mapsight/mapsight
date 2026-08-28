import {describe, expect, it} from "vitest";

import {ACTION_NOOP, ACTION_SET} from "@/lib/base/reducer";
import {MapController} from "@/lib/map/controller";
import type {LayerState, MapState} from "@/lib/map/types";

import WithLayers from "./WithLayers";

function tileLayer(
	visible: boolean,
	metaData: LayerState["metaData"] = {},
): LayerState {
	return {
		type: "TileLayer",
		metaData,
		options: {visible},
	};
}

function mapState(layers: Record<string, LayerState>): MapState {
	return {
		layers,
		size: [0, 0],
	};
}

describe("WithLayers dependent visibility", () => {
	const controller = new WithLayers("map");

	it("derives visibleWhenLayerIds after the action is applied", () => {
		const before = mapState({
			base: tileLayer(true, {isBaseLayer: true}),
			theme: tileLayer(true),
			companion: tileLayer(false, {
				visibleWhenLayerIds: ["base", "theme"],
			}),
		});

		const afterShow = controller.reduce(before, {type: ACTION_NOOP});
		expect(afterShow.layers.companion?.options?.visible).toBe(true);

		const afterHideTheme = controller.reduce(afterShow, {
			type: ACTION_SET,
			path: ["layers", "theme", "options", "visible"],
			value: false,
		});
		expect(afterHideTheme.layers.theme?.options?.visible).toBe(false);
		expect(afterHideTheme.layers.companion?.options?.visible).toBe(false);
	});

	it("is applied on MapController so store reduces derive visibility", () => {
		const controller = new MapController("map");
		const next = controller.reduce(
			mapState({
				base: tileLayer(true),
				theme: tileLayer(true),
				companion: tileLayer(false, {
					visibleWhenLayerIds: ["base", "theme"],
				}),
			}),
			{type: ACTION_NOOP},
		);
		expect(next.layers.companion?.options?.visible).toBe(true);
	});
});
