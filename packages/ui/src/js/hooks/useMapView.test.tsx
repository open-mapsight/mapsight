import {act, cleanup, renderHook} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import {set} from "@mapsight/core/lib/base/actions";

import {MapHookProvider, createMapHookStore} from "./__tests__/map-hook-store";
import useMapView from "./useMapView";

afterEach(cleanup);

function setup(slices: Record<string, unknown>, controllerName?: string) {
	const store = createMapHookStore(slices);
	const hook = renderHook(() => useMapView(controllerName), {
		wrapper: ({children}) => (
			<MapHookProvider store={store}>{children}</MapHookProvider>
		),
	});
	return {store, ...hook};
}

describe("useMapView", () => {
	it("returns the view state of the default map and follows changes", () => {
		const view = {center: [10, 20], zoom: 5, resolution: 8, rotation: 0.1};
		const {result, store} = setup({map: {layers: {}, size: [1, 1], view}});

		expect(result.current).toBe(view);

		act(() => {
			store.dispatch(set(["map", "view", "zoom"], 6));
		});
		expect(result.current).toEqual({...view, zoom: 6});
	});

	it("does not return a new view for unrelated state changes", () => {
		const {result, store} = setup({
			map: {layers: {}, size: [1, 1], view: {zoom: 5}},
		});
		const before = result.current;

		act(() => {
			store.dispatch(set(["map", "size"], [2, 2]));
		});
		expect(result.current).toBe(before);
	});

	it("reads another map controller", () => {
		const {result} = setup(
			{
				map: {layers: {}, size: [1, 1], view: {zoom: 1}},
				overview: {layers: {}, size: [1, 1], view: {zoom: 9}},
			},
			"overview",
		);

		expect(result.current).toEqual({zoom: 9});
	});

	it("is undefined while the map has no view state", () => {
		const {result} = setup({map: {layers: {}, size: [1, 1]}});

		expect(result.current).toBeUndefined();
	});
});
