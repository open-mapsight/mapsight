import {getForViewAndSize} from "ol/extent";

import {describe, expect, it} from "vitest";

import {
	viewCenterSelector,
	viewExtentSelector,
	viewResolutionSelector,
	viewRotationSelector,
	viewSelector,
	viewZoomSelector,
} from "@/lib/map/selectors";
import type {MapState} from "@/lib/map/types";

function makeState(view?: MapState["view"], size?: [number, number]) {
	return {layers: {}, size, view} as MapState;
}

describe("map view selectors", () => {
	it("read the view fields", () => {
		const view = {
			center: [1000, 2000],
			zoom: 12,
			resolution: 4.5,
			rotation: 0.5,
		};
		const state = makeState(view, [800, 600]);

		expect(viewSelector(state)).toBe(view);
		expect(viewCenterSelector(state)).toBe(view.center);
		expect(viewZoomSelector(state)).toBe(12);
		expect(viewResolutionSelector(state)).toBe(4.5);
		expect(viewRotationSelector(state)).toBe(0.5);
	});

	it("tolerate a missing view and default rotation to 0", () => {
		const state = makeState(undefined, [800, 600]);

		expect(viewSelector(state)).toBeUndefined();
		expect(viewCenterSelector(state)).toBeUndefined();
		expect(viewZoomSelector(state)).toBeUndefined();
		expect(viewResolutionSelector(state)).toBeUndefined();
		// The controller does not write a rotation of 0, so a view without
		// rotation is an unrotated view.
		expect(viewRotationSelector(state)).toBe(0);
		expect(viewRotationSelector(makeState({}))).toBe(0);
	});
});

describe("viewExtentSelector", () => {
	const view = {center: [1000, 2000], resolution: 2, rotation: 0};

	it("computes the visible extent in view projection units", () => {
		expect(viewExtentSelector(makeState(view, [800, 600]))).toEqual([
			200, 1400, 1800, 2600,
		]);
	});

	it("takes rotation into account and treats it as 0 when missing", () => {
		const rotated = {...view, rotation: Math.PI / 4};
		expect(viewExtentSelector(makeState(rotated, [800, 600]))).toEqual(
			getForViewAndSize([1000, 2000], 2, Math.PI / 4, [800, 600]),
		);
		expect(
			viewExtentSelector(
				makeState({center: view.center, resolution: 2}, [800, 600]),
			),
		).toEqual([200, 1400, 1800, 2600]);
	});

	it("returns undefined while an input is missing", () => {
		const size: [number, number] = [800, 600];
		expect(viewExtentSelector(makeState(undefined, size))).toBeUndefined();
		expect(
			viewExtentSelector(makeState({...view, center: undefined}, size)),
		).toBeUndefined();
		expect(
			viewExtentSelector(
				makeState({...view, resolution: undefined}, size),
			),
		).toBeUndefined();
		expect(viewExtentSelector(makeState(view, undefined))).toBeUndefined();
	});

	it("keeps the reference while the inputs are unchanged", () => {
		const state = makeState(view, [800, 600]);
		const extent = viewExtentSelector(state);

		expect(viewExtentSelector(state)).toBe(extent);
		// An unrelated change such as the zoom level or layers does not
		// invalidate the extent.
		expect(
			viewExtentSelector({
				...state,
				layers: {other: {}},
				view: {...view, zoom: 3},
			}),
		).toBe(extent);
	});

	it("keeps the reference when equal values are written again", () => {
		const extent = viewExtentSelector(makeState(view, [800, 600]));
		const next = viewExtentSelector(
			makeState({...view, center: [1000, 2000]}, [800, 600]),
		);

		expect(next).toBe(extent);
	});

	it("returns a new extent when an input changes", () => {
		const extent = viewExtentSelector(makeState(view, [800, 600]));

		expect(
			viewExtentSelector(makeState({...view, resolution: 4}, [800, 600])),
		).not.toBe(extent);
		expect(viewExtentSelector(makeState(view, [1024, 768]))).not.toBe(
			extent,
		);
	});
});
