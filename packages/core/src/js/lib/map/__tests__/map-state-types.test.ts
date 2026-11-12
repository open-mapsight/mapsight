import {describe, expect, it} from "vitest";

import type {MapState, MapViewState} from "@/lib/map/types";

// Host code declares its own shapes, often as interfaces, which have no
// implicit index signature. They have to stay assignable to the state types.
// The assignments below are the actual checks: `pnpm typecheck` fails when
// they stop compiling.
interface HostView {
	center?: number[];
	zoom?: number;
	extent?: number[];
}

type HostMapState = {
	layers: Record<string, never>;
	size: [number, number];
	view: HostView;
};

describe("MapState typing", () => {
	it("accepts a view declared as a host interface", () => {
		const view: HostView = {center: [1, 2], zoom: 3};
		const hostState: HostMapState = {layers: {}, size: [800, 600], view};
		const state: MapState = hostState;

		expect(state.view).toBe(view);
	});

	it("describes selector results without an index signature", () => {
		// MapViewState is only what the selectors return. Callers do not have
		// to provide one, and plain host objects are compatible with it.
		const view: HostView = {center: [1, 2], zoom: 3};
		const selected: MapViewState = view;

		expect(selected.zoom).toBe(3);
	});
});
