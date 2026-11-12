import {act, cleanup, renderHook} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import {set} from "@mapsight/core/lib/base/actions";

import {MapHookProvider, createMapHookStore} from "./__tests__/map-hook-store";
import useLayerVisibility from "./useLayerVisibility";

afterEach(cleanup);

const layers = {
	parking: {type: "Vector", options: {visible: true}},
	traffic: {type: "Vector", options: {visible: false}},
	plain: {type: "Vector"},
};

type MapSlices = Record<
	string,
	{layers: Record<string, {options?: {visible?: boolean}}>}
>;

function storedVisibility(
	store: ReturnType<typeof createMapHookStore>,
	controllerName: string,
	layerId: string,
) {
	const slices = store.getState() as MapSlices;
	return slices[controllerName]?.layers[layerId]?.options?.visible;
}

function setup(layerId: string, controllerName?: string, extra = {}) {
	const store = createMapHookStore({map: {layers}, ...extra});
	const hook = renderHook(() => useLayerVisibility(layerId, controllerName), {
		wrapper: ({children}) => (
			<MapHookProvider store={store}>{children}</MapHookProvider>
		),
	});
	return {store, ...hook};
}

describe("useLayerVisibility", () => {
	it("reads the visibility of the layer", () => {
		expect(setup("parking").result.current[0]).toBe(true);
		expect(setup("traffic").result.current[0]).toBe(false);
	});

	it("treats unknown layers and layers without the option as hidden", () => {
		expect(setup("plain").result.current[0]).toBe(false);
		expect(setup("missing").result.current[0]).toBe(false);
	});

	it("sets the visibility in the store", () => {
		const {result, store} = setup("traffic");

		act(() => result.current[1](true));
		expect(result.current[0]).toBe(true);
		expect(storedVisibility(store, "map", "traffic")).toBe(true);

		act(() => result.current[1](false));
		expect(result.current[0]).toBe(false);
		expect(storedVisibility(store, "map", "traffic")).toBe(false);
	});

	it("follows changes made elsewhere", () => {
		const {result, store} = setup("parking");

		act(() => {
			store.dispatch(
				set(["map", "layers", "parking", "options", "visible"], false),
			);
		});
		expect(result.current[0]).toBe(false);
	});

	it("switches layer when the id changes", () => {
		const store = createMapHookStore({map: {layers}});
		const {result, rerender} = renderHook(
			({id}) => useLayerVisibility(id),
			{
				initialProps: {id: "parking"},
				wrapper: ({children}) => (
					<MapHookProvider store={store}>{children}</MapHookProvider>
				),
			},
		);

		expect(result.current[0]).toBe(true);
		rerender({id: "traffic"});
		expect(result.current[0]).toBe(false);
	});

	it("targets another map controller", () => {
		const {result, store} = setup("traffic", "overview", {
			overview: {layers: {traffic: {options: {visible: false}}}},
		});

		act(() => result.current[1](true));
		expect(storedVisibility(store, "overview", "traffic")).toBe(true);
		expect(storedVisibility(store, "map", "traffic")).toBe(false);
	});
});
