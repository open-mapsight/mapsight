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

	it("is a stable empty object while the controller slice does not exist", () => {
		const store = createMapHookStore({other: {}});
		const {result, rerender} = renderHook(
			({name}) => useVisibleLayerAttributions(name),
			{
				initialProps: {name: "missing"},
				wrapper: ({children}) => (
					<MapHookProvider store={store}>{children}</MapHookProvider>
				),
			},
		);

		expect(result.current).toEqual({});
		const empty = result.current;
		act(() => {
			store.dispatch(set(["other", "x"], 1));
		});
		rerender({name: "missing"});
		expect(result.current).toBe(empty);
	});

	it("follows the controller name changing, also to a missing slice", () => {
		const store = createMapHookStore({
			map: mapState,
			overview: {
				layers: {top: {metaData: {attribution: "© Overview"}}},
				visibleLayers: ["top"],
			},
		});
		const {result, rerender} = renderHook(
			({name}) => useVisibleLayerAttributions(name),
			{
				initialProps: {name: "map"},
				wrapper: ({children}) => (
					<MapHookProvider store={store}>{children}</MapHookProvider>
				),
			},
		);

		expect(result.current).toEqual({base: "© Base data"});
		rerender({name: "overview"});
		expect(result.current).toEqual({top: "© Overview"});
		rerender({name: "later"});
		expect(result.current).toEqual({});
		rerender({name: "map"});
		expect(result.current).toEqual({base: "© Base data"});
	});

	describe("re-rendering", () => {
		function setupCounting(slices: Record<string, unknown>) {
			const store = createMapHookStore(slices);
			let renders = 0;
			const hook = renderHook(
				() => {
					renders += 1;
					return useVisibleLayerAttributions();
				},
				{
					wrapper: ({children}) => (
						<MapHookProvider store={store}>
							{children}
						</MapHookProvider>
					),
				},
			);
			return {store, renders: () => renders, ...hook};
		}

		it("does not re-render for an unrelated layer option change", () => {
			const {result, store, renders} = setupCounting({map: mapState});
			const before = result.current;
			const rendersBefore = renders();

			act(() => {
				store.dispatch(
					set(["map", "layers", "poi", "options"], {opacity: 0.5}),
				);
			});
			act(() => {
				store.dispatch(
					set(["map", "layers", "base", "options"], {opacity: 0.5}),
				);
			});

			expect(result.current).toBe(before);
			expect(renders()).toBe(rendersBefore);
		});

		it("does not re-render on every state change without visible layers", () => {
			const {result, store, renders} = setupCounting({
				map: {layers: mapState.layers},
			});
			const before = result.current;
			const rendersBefore = renders();

			act(() => {
				store.dispatch(set(["map", "size"], [2, 2]));
			});
			act(() => {
				store.dispatch(set(["map", "size"], [3, 3]));
			});

			expect(result.current).toBe(before);
			expect(renders()).toBe(rendersBefore);
		});

		it("re-renders when an attribution text changes", () => {
			const {result, store} = setupCounting({map: mapState});

			act(() => {
				store.dispatch(
					set(
						["map", "layers", "base", "metaData", "attribution"],
						"© New",
					),
				);
			});
			expect(result.current).toEqual({base: "© New"});
		});
	});
});
