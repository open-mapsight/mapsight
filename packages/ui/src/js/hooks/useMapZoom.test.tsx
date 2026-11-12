import {act, cleanup, renderHook} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {set} from "@mapsight/core/lib/base/actions";
import {animate} from "@mapsight/core/lib/map/actions";

import {MapHookProvider, createMapHookStore} from "./__tests__/map-hook-store";
import useMapZoom from "./useMapZoom";

afterEach(cleanup);

function setup(slices: Record<string, unknown>, controllerName?: string) {
	const store = createMapHookStore(slices);
	const dispatch = vi.spyOn(store, "dispatch");
	const hook = renderHook(() => useMapZoom(controllerName), {
		wrapper: ({children}) => (
			<MapHookProvider store={store}>{children}</MapHookProvider>
		),
	});
	return {store, dispatch, ...hook};
}

describe("useMapZoom", () => {
	it("returns the zoom and follows changes", () => {
		const {result, store} = setup({map: {view: {zoom: 10}}});

		expect(result.current.zoom).toBe(10);

		act(() => {
			store.dispatch(set(["map", "view", "zoom"], 12));
		});
		expect(result.current.zoom).toBe(12);
	});

	it("dispatches the animate action the zoom buttons use", () => {
		const {result, dispatch} = setup({map: {view: {zoom: 10}}});

		act(() => result.current.zoomIn());
		expect(dispatch).toHaveBeenLastCalledWith(
			animate("map", {zoom: 11, duration: 200}),
		);

		act(() => result.current.zoomOut());
		expect(dispatch).toHaveBeenLastCalledWith(
			animate("map", {zoom: 9, duration: 200}),
		);
	});

	it("zooms from the current level after it changed", () => {
		const {result, store, dispatch} = setup({map: {view: {zoom: 10}}});

		act(() => {
			store.dispatch(set(["map", "view", "zoom"], 14));
		});
		act(() => result.current.zoomIn());
		expect(dispatch).toHaveBeenLastCalledWith(
			animate("map", {zoom: 15, duration: 200}),
		);
	});

	it("targets another map controller", () => {
		const {result, dispatch} = setup(
			{map: {view: {zoom: 1}}, overview: {view: {zoom: 4}}},
			"overview",
		);

		expect(result.current.zoom).toBe(4);
		act(() => result.current.zoomOut());
		expect(dispatch).toHaveBeenLastCalledWith(
			animate("overview", {zoom: 3, duration: 200}),
		);
	});

	it("has no zoom without view state and steps from 0", () => {
		const {result, dispatch} = setup({map: {}});

		expect(result.current.zoom).toBeUndefined();
		act(() => result.current.zoomIn());
		expect(dispatch).toHaveBeenLastCalledWith(
			animate("map", {zoom: 1, duration: 200}),
		);
	});

	it("keeps its result while the zoom is unchanged", () => {
		const {result, rerender, store} = setup({
			map: {size: [1, 1], view: {zoom: 10}},
		});
		const before = result.current;

		act(() => {
			store.dispatch(set(["map", "size"], [2, 2]));
		});
		rerender();
		expect(result.current).toBe(before);
	});
});
