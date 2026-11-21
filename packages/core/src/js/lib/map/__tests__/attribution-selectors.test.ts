import {describe, expect, it} from "vitest";

import {
	layerAttributionsSelector,
	visibleLayerAttributionPartsSelector,
	visibleLayerAttributionsSelector,
} from "@/lib/map/selectors";
import type {MapState} from "@/lib/map/types";

function makeState(): MapState {
	return {
		layers: {
			text: {metaData: {attribution: "Text only"}},
			html: {metaData: {dangerouslySetAttributionHtml: "<b>Html</b>"}},
			both: {
				metaData: {
					attribution: "Both",
					dangerouslySetAttributionHtml: "<i>Both</i>",
				},
			},
			empty: {metaData: {attribution: "", title: "No attribution"}},
			noMetaData: {},
			hidden: {metaData: {attribution: "Not visible"}},
		},
		visibleLayers: ["both", "text", "html", "empty", "noMetaData", "both"],
	} as unknown as MapState;
}

describe("visibleLayerAttributionPartsSelector", () => {
	it("returns text and html per visible layer in visible-layer order", () => {
		const result = visibleLayerAttributionPartsSelector(makeState());
		expect(result).toEqual({
			both: {text: "Both", html: "<i>Both</i>"},
			text: {text: "Text only"},
			html: {html: "<b>Html</b>"},
		});
		expect(Object.keys(result)).toEqual(["both", "text", "html"]);
	});

	it("returns an empty object without layers or visible layers", () => {
		expect(
			visibleLayerAttributionPartsSelector({} as unknown as MapState),
		).toEqual({});
		expect(
			visibleLayerAttributionPartsSelector({
				layers: {},
				visibleLayers: ["x"],
			} as unknown as MapState),
		).toEqual({});
	});

	it("is memoized for an unchanged state", () => {
		const state = makeState();
		expect(visibleLayerAttributionPartsSelector(state)).toBe(
			visibleLayerAttributionPartsSelector(state),
		);
	});

	it("leaves the string-based selectors on `attribution` only", () => {
		const state = makeState();
		expect(layerAttributionsSelector(state)).toEqual({
			text: "Text only",
			both: "Both",
			empty: "",
			hidden: "Not visible",
		});
		expect(visibleLayerAttributionsSelector(state)).toEqual({
			both: "Both",
			text: "Text only",
		});
	});
});
