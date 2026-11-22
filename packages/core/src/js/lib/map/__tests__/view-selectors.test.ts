import View from "ol/View";
import {getForViewAndSize} from "ol/extent";
import {clearUserProjection, useGeographic} from "ol/proj";

import {afterEach, describe, expect, it} from "vitest";

import {createMapsightStore} from "@/index";
import {merge} from "@/lib/base/actions";
import type {BaseController} from "@/lib/base/controller";
import {setViewCenter} from "@/lib/map/actions";
import {MapController} from "@/lib/map/controller";
import {
	viewCenterSelector,
	viewExtentSelector,
	viewResolutionSelector,
	viewRotationSelector,
	viewSelector,
	viewZoomSelector,
} from "@/lib/map/selectors";
import type {MapState, MapViewState} from "@/lib/map/types";

function makeState(view?: MapViewState, size?: [number, number]) {
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

describe("viewExtentSelector against a real view", () => {
	const size: [number, number] = [800, 600];

	afterEach(() => {
		clearUserProjection();
	});

	// The state holds what the map controller reads from the OpenLayers view.
	function stateOf(view: View) {
		return makeState(
			{
				center: view.getCenter(),
				resolution: view.getResolution(),
				rotation: view.getRotation(),
			},
			size,
		);
	}

	function expectExtent(actual: unknown, expected: number[]) {
		expect(actual).toHaveLength(4);
		expected.forEach((value, index) => {
			expect((actual as number[])[index]).toBeCloseTo(value, 6);
		});
	}

	it.each([0, Math.PI / 6])(
		"matches calculateExtent in view projection coordinates (rotation %d)",
		(rotation) => {
			const view = new View({
				center: [1113194, 6446275],
				resolution: 38.2,
				rotation,
			});

			expectExtent(
				viewExtentSelector(stateOf(view)),
				view.calculateExtent(size),
			);
		},
	);

	it.each([0, Math.PI / 6])(
		"matches calculateExtent in user coordinates (rotation %d)",
		(rotation) => {
			useGeographic();
			const view = new View({
				center: [10, 51],
				resolution: 38.2,
				rotation,
			});
			const state = stateOf(view);

			// The center is stored in degrees, the extent is returned in degrees.
			expect(viewCenterSelector(state)).toEqual([10, 51]);
			const extent = view.calculateExtent(size);
			expect(extent[2]! - extent[0]!).toBeLessThan(1);
			expectExtent(viewExtentSelector(state), extent);
		},
	);

	it.each([false, true])(
		"keeps the displayed extent when switching projection (geographic first: %s)",
		async (geographicFirst) => {
			if (geographicFirst) useGeographic();
			const controller = new MapController("map");
			const store = createMapsightStore(
				{map: controller as unknown as BaseController},
				{},
				{
					map: {
						layers: {},
						view: {
							center: geographicFirst
								? [10, 50]
								: [1113194, 6446275],
							zoom: 10,
						},
					},
				},
			);
			const map = controller.getMap()!;
			try {
				map.setSize(size);
				await expect
					.poll(() => (store.getState().map as MapState).size)
					.toEqual(size);
				const state = store.getState().map as MapState;
				const view = map.getView();
				expectExtent(
					viewExtentSelector(state),
					view.calculateExtent(size),
				);
				if (geographicFirst) clearUserProjection();
				else useGeographic();
				const center = view.getCenter();
				expect(viewCenterSelector(state)).toEqual(center);
				expect(viewSelector(state)?.center).toEqual(center);
				expect(viewSelector(state)).toBe(viewSelector(state));
				expectExtent(
					viewExtentSelector(state),
					view.calculateExtent(size),
				);
			} finally {
				map.dispose();
			}
		},
	);

	it.each([false, true])(
		"uses the new center immediately after a view update (geographic: %s)",
		async (geographic) => {
			if (geographic) useGeographic();
			const controller = new MapController("map");
			const store = createMapsightStore(
				{map: controller as unknown as BaseController},
				{},
				{
					map: {
						layers: {},
						view: {
							center: geographic ? [10, 50] : [1113194, 6446275],
							zoom: 10,
						},
					},
				},
			);
			const map = controller.getMap()!;
			try {
				map.setSize(size);
				const state = () => store.getState().map as MapState;
				await expect.poll(() => state().size).toEqual(size);
				const view = map.getView();
				const newCenter = geographic ? [3, 4] : [300000, 400000];
				const mergedCenter = geographic ? [6, 7] : [600000, 700000];
				for (const action of [
					setViewCenter("map", newCenter),
					merge(["map", "view"], {center: mergedCenter}),
				]) {
					store.dispatch(action as never);
					expectExtent(
						viewExtentSelector(state()),
						view.calculateExtent(size),
					);
				}
			} finally {
				map.dispose();
			}
		},
	);

	it.each([
		{zoom: 10},
		{resolution: 100},
		{
			zoom: 10,
			extent: [-1e6, -1e6, 1e6, 1e6],
			center: [2e6, 2e6],
			rotation: 0.02,
		},
	])(
		"publishes the initial extent through the map controller with %j",
		async (options) => {
			const controller = new MapController("map");
			const store = createMapsightStore(
				{map: controller as unknown as BaseController},
				{},
				{
					map: {layers: {}, view: {center: [1000, 2000], ...options}},
				},
			);
			const map = controller.getMap()!;
			try {
				map.setSize(size);
				const view = map.getView();
				const state = () => store.getState().map as MapState;
				await expect.poll(() => state().size).toEqual(size);
				expect(viewCenterSelector(state())).toEqual(view.getCenter());
				expect(viewRotationSelector(state())).toBe(view.getRotation());
				expect(viewZoomSelector(state())).toBe(
					Math.round(view.getZoom()!),
				);
				expect(viewResolutionSelector(state())).toBe(
					view.getResolution(),
				);
				expectExtent(
					viewExtentSelector(state()),
					view.calculateExtent(size),
				);
			} finally {
				map.dispose();
			}
		},
	);
});
