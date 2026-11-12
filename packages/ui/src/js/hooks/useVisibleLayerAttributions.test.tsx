import {act, cleanup, renderHook} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import {set} from "@mapsight/core/lib/base/actions";

import {MapHookProvider, createMapHookStore} from "./__tests__/map-hook-store";
import useVisibleLayerAttributions from "./useVisibleLayerAttributions";

afterEach(cleanup);

const mapState = {
	layers: {
		base: {metaData: {attribution: "© Base data"}},
		poi: {metaData: {attribution: "© POI data"}},
		plain: {},
	},
	visibleLayers: ["base", "plain"],
};

function setup(slices: Record<string, unknown>, controllerName?: string) {
	const store = createMapHookStore(slices);
	const hook = renderHook(() => useVisibleLayerAttributions(controllerName), {
		wrapper: ({children}) => (
			<MapHookProvider store={store}>{children}</MapHookProvider>
		),
	});
	return {store, ...hook};
}

describe("useVisibleLayerAttributions", () => {
	it("returns the attributions of rendered layers that have one", () => {
		const {result} = setup({map: mapState});

		expect(result.current).toEqual({base: "© Base data"});
	});

	it("follows the visible layers", () => {
		const {result, store} = setup({map: mapState});

		act(() => {
			store.dispatch(set(["map", "visibleLayers"], ["base", "poi"]));
		});
		expect(result.current).toEqual({
			base: "© Base data",
			poi: "© POI data",
		});
	});

	it("is empty without layers or visible layers", () => {
		expect(setup({map: {layers: {}}}).result.current).toEqual({});
		expect(setup({map: {layers: mapState.layers}}).result.current).toEqual(
			{},
		);
	});

	it("keeps its reference while the attributions are unchanged", () => {
		const {result, store} = setup({map: mapState});
		const before = result.current;

		act(() => {
			store.dispatch(set(["map", "size"], [2, 2]));
		});
		expect(result.current).toBe(before);
	});

	it("reads another map controller", () => {
		const {result} = setup(
			{
				map: mapState,
				overview: {
					layers: {top: {metaData: {attribution: "© Overview"}}},
					visibleLayers: ["top"],
				},
			},
			"overview",
		);

		expect(result.current).toEqual({top: "© Overview"});
	});
});
