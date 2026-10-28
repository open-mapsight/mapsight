import Feature from "ol/Feature";
import View from "ol/View";
import Point from "ol/geom/Point";

import {afterEach, describe, expect, it, vi} from "vitest";

import {DEFAULT_OPTIONS as FIT_OPTIONS} from "@mapsight/lib-ol/map/fitToExtent";

import {animate} from "@/lib/map/actions";
import {createHighlightTestMap} from "@/test/create-highlight-test-map";

import runWithMotionPreference from "./runWithMotionPreference";

const cleanup: Array<() => void> = [];
afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
	cleanup.splice(0).forEach((fn) => fn());
	vi.restoreAllMocks();
});

// matchMedia is absent in the simulated browser. Supply a mutable query result.
function runtime(reduced = false) {
	const context = createHighlightTestMap();
	context.map.renderSync();
	cleanup.push(() => {
		context.map.dispose();
		context.target.remove();
	});
	const events = new EventTarget();
	const media = Object.assign(events, {matches: reduced});
	const remove = vi.spyOn(media, "removeEventListener");
	const previous = window.matchMedia;
	window.matchMedia = vi.fn(() => media as unknown as MediaQueryList);
	cleanup.push(() => {
		window.matchMedia = previous;
	});
	return {...context, media, remove};
}

describe("map motion preferences", () => {
	it("honours changes between queuing and rendering, without mutating options", () => {
		const {mapController, map, media} = runtime();
		const view = map.getView();
		const options = {center: [1000, 2000], duration: 900};
		mapController.animate(options);
		media.matches = true;
		map.dispatchEvent("postrender");
		expect(view.getCenter()).toEqual(options.center);
		expect(view.getAnimating()).toBe(false);
		expect(options.duration).toBe(900);
		media.matches = false;
		mapController.animate({center: [3000, 4000], duration: 900});
		map.dispatchEvent("postrender");
		expect(view.getAnimating()).toBe(true);
	});

	it("settles an in-flight transition at its destination and releases listeners", () => {
		const {mapController, map, media, remove} = runtime();
		mapController.animate({
			center: [5000, 6000],
			zoom: 12,
			duration: 10000,
		});
		map.dispatchEvent("postrender");
		expect(map.getView().getAnimating()).toBe(true);
		media.matches = true;
		media.dispatchEvent(new Event("change"));
		expect(map.getView().getCenter()).toEqual([5000, 6000]);
		expect(map.getView().getZoom()).toBe(12);
		expect(map.getView().getAnimating()).toBe(false);
		expect(remove).toHaveBeenCalled();
	});

	it("applies to animate actions, geometry fits and every feature helper", () => {
		const {mapController, map, store} = runtime(true);
		const view = map.getView();
		const fit = vi.spyOn(view, "fit");
		const animation = vi.spyOn(view, "animate");
		const feature = new Feature(new Point([10000, 20000]));
		const render = () => map.dispatchEvent("postrender");
		store.dispatch(
			animate("map", {bounds: [0, 0, 1000, 1000], duration: 500}),
		);
		render();
		mapController.fit(new Point([2000, 3000]), {
			duration: 500,
			maxZoom: 15,
		});
		render();
		mapController.fitMapViewToFeature(feature);
		render();
		mapController.fitMapViewToFeatures([feature], {
			duration: 500,
			keepZoom: true,
			skipIfInView: false,
		});
		render();
		mapController.centerViewOnFeature(feature);
		render();
		mapController.centerViewOnFeatures([feature], {duration: 500});
		render();
		expect(fit.mock.calls.length).toBeGreaterThanOrEqual(3);
		for (const [, options] of fit.mock.calls)
			expect(options?.duration).toBe(0);
		for (const [options] of animation.mock.calls)
			expect(
				typeof options === "object" ? options.duration : undefined,
			).toBe(0);
		expect(view.getAnimating()).toBe(false);
	});

	it("cleans preference listeners when animations finish, the target detaches or view changes", () => {
		const {mapController, map, remove} = runtime();
		mapController.animate({center: [5000, 6000], duration: 10000});
		map.dispatchEvent("postrender");
		map.getView().cancelAnimations();
		expect(remove).toHaveBeenCalledTimes(1);
		mapController.animate({center: [5000, 6000], duration: 10000});
		map.dispatchEvent("postrender");
		map.setTarget(undefined);
		expect(remove).toHaveBeenCalledTimes(2);
	});

	it("runs without window/document or matchMedia on the server", () => {
		const {map} = runtime();
		vi.stubGlobal("window", undefined);
		vi.stubGlobal("document", undefined);
		const action = vi.fn();
		const dispose = runWithMotionPreference(map, action);
		expect(action).toHaveBeenCalledWith(false);
		expect(() => dispose()).not.toThrow();
	});
});

it.each(["pan", "zoom"])(
	"updates native keyboard %s duration per event without changing caller options",
	async (kind) => {
		const {map, target, media} = runtime(true);
		const definition =
			kind === "pan"
				? (
						await import("@/ol-proxy/definitions/interaction/KeyboardPanInteraction")
					).default
				: (
						await import("@/ol-proxy/definitions/interaction/KeyboardZoomInteraction")
					).default;
		const options = {duration: 10000};
		const interaction = new definition.Constructor(options);
		map.addInteraction(interaction);
		target.tabIndex = 0;
		target.focus();
		const key = kind === "pan" ? "ArrowRight" : "+";
		target.dispatchEvent(
			new window.KeyboardEvent("keydown", {key, bubbles: true}),
		);
		expect(map.getView().getAnimating()).toBe(false);
		expect(options.duration).toBe(10000);
		media.matches = false;
		target.dispatchEvent(
			new window.KeyboardEvent("keydown", {key, bubbles: true}),
		);
		expect(map.getView().getAnimating()).toBe(true);
	},
);

// Drive OL's real animation clock; no animate/fit/cancel implementation stubs.
function animationClock() {
	const start = Date.now();
	const now = vi.spyOn(Date, "now").mockReturnValue(start);
	return (elapsed: number, view: View) => {
		now.mockReturnValue(start + elapsed);
		view.updateAnimations_();
	};
}

const callbacksFlushed = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("motion preference regressions with real OL animation series", () => {
	it.each([false, true])(
		"finishes the original feature fit after it becomes visible (keepZoom=%s)",
		async (keepZoom) => {
			const {mapController, map, media} = runtime();
			const view = map.getView();
			const advance = animationClock();
			const callback = vi.fn();
			const feature = new Feature(new Point([16000, 0]));
			mapController.fitMapViewToFeature(feature, {
				...FIT_OPTIONS,
				keepZoom,
				duration: 1000,
				callback,
			});
			map.dispatchEvent("postrender");
			advance(800, view);
			expect(view.getCenter()![0]).toBeCloseTo(14336);
			const visibleExtent = view.calculateExtent(map.getSize());
			expect(visibleExtent[0]).toBeLessThan(16000);
			expect(visibleExtent[2]).toBeGreaterThan(16000);
			media.matches = true;
			media.dispatchEvent(new Event("change"));
			expect(view.getCenter()).toEqual([16000, 0]);
			expect(view.getZoom()).toBe(keepZoom ? 10 : 17);
			expect(view.getAnimating()).toBe(false);
			await callbacksFlushed();
			expect(callback.mock.calls).toEqual([[true]]);
		},
	);

	it.each(["complete", "cancel", "reduce"])(
		"calls an OL fit callback exactly once on %s",
		async (outcome) => {
			const {mapController, map, media} = runtime();
			const view = map.getView();
			const advance = animationClock();
			const callback = vi.fn();
			mapController.fit([30000, 40000, 32000, 42000], {
				duration: 1000,
				callback,
			});
			map.dispatchEvent("postrender");
			advance(800, view);
			if (outcome === "reduce") {
				media.matches = true;
				media.dispatchEvent(new Event("change"));
			} else if (outcome === "cancel") view.cancelAnimations();
			else advance(1000, view);
			await callbacksFlushed();
			expect(callback.mock.calls).toEqual([[outcome !== "cancel"]]);
		},
	);

	it("retains parallel zoom and center targets across separate rendered requests", () => {
		const {mapController, map, media} = runtime();
		const view = map.getView();
		const advance = animationClock();
		mapController.animate({zoom: 14, duration: 1000});
		map.dispatchEvent("postrender");
		advance(200, view);
		mapController.animate({center: [5000, 6000], duration: 1000});
		map.dispatchEvent("postrender");
		advance(800, view);
		media.matches = true;
		media.dispatchEvent(new Event("change"));
		expect(view.getZoom()).toBe(14);
		expect(view.getCenter()).toEqual([5000, 6000]);
		expect(view.getAnimating()).toBe(false);
	});

	it("finishes remaining serial steps without reapplying a completed anchored zoom", async () => {
		const {map, media} = runtime();
		const view = map.getView();
		const advance = animationClock();
		const callback = vi.fn();
		runWithMotionPreference(map, () =>
			view.animate(
				{zoom: 11, anchor: [1000, 2000], duration: 100},
				{center: [5000, 6000], duration: 1000},
				{zoom: 14, duration: 1000},
				callback,
			),
		);
		advance(500, view);
		media.matches = true;
		media.dispatchEvent(new Event("change"));
		expect(view.getZoom()).toBe(14);
		expect(view.getCenter()).toEqual([5000, 6000]);
		expect(view.getAnimating()).toBe(false);
		await callbacksFlushed();
		expect(callback.mock.calls).toEqual([[true]]);
	});

	it("keeps the center produced by a completed anchored step when finishing a series", async () => {
		const {map, media} = runtime();
		const view = map.getView();
		const advance = animationClock();
		const callback = vi.fn();
		runWithMotionPreference(map, () =>
			view.animate(
				{zoom: 11, anchor: [1000, 2000], duration: 100},
				{rotation: 0.5, duration: 1000},
				callback,
			),
		);
		advance(500, view);
		const center = view.getCenter()!.slice();
		media.matches = true;
		media.dispatchEvent(new Event("change"));
		expect(view.getCenter()).toEqual(center);
		expect(view.getZoom()).toBe(11);
		expect(view.getRotation()).toBe(0.5);
		expect(view.getAnimating()).toBe(false);
		await callbacksFlushed();
		expect(callback.mock.calls).toEqual([[true]]);
	});

	it("completes every parallel series callback once", async () => {
		const {map, media} = runtime();
		const view = map.getView();
		const advance = animationClock();
		const zoom = vi.fn();
		const center = vi.fn();
		runWithMotionPreference(map, () =>
			view.animate({zoom: 14, duration: 1000}, zoom),
		);
		advance(200, view);
		runWithMotionPreference(map, () =>
			view.animate({center: [5000, 6000], duration: 1000}, center),
		);
		advance(800, view);
		media.matches = true;
		media.dispatchEvent(new Event("change"));
		await callbacksFlushed();
		expect(zoom.mock.calls).toEqual([[true]]);
		expect(center.mock.calls).toEqual([[true]]);
		expect(view.getZoom()).toBe(14);
		expect(view.getCenter()).toEqual([5000, 6000]);
	});

	it("does not globally cancel existing work merely to start an instant request", () => {
		const {mapController, map} = runtime(true);
		const view = map.getView();
		const advance = animationClock();
		view.animate({zoom: 14, duration: 1000});
		mapController.animate({center: [5000, 6000], duration: 1000});
		map.dispatchEvent("postrender");
		advance(1000, view);
		expect(view.getZoom()).toBe(14);
		expect(view.getCenter()).toEqual([5000, 6000]);
	});

	it("settles only its own series and preserves unrelated OL work and callback", async () => {
		const {mapController, map, media} = runtime();
		const view = map.getView();
		const advance = animationClock();
		const external = vi.fn();
		view.animate({zoom: 14, duration: 1000}, external);
		mapController.animate({center: [5000, 6000], duration: 1000});
		map.dispatchEvent("postrender");
		advance(500, view);
		media.matches = true;
		media.dispatchEvent(new Event("change"));
		expect(view.getAnimating()).toBe(true);
		expect(view.getCenter()).toEqual([5000, 6000]);
		advance(1000, view);
		expect(view.getAnimating()).toBe(false);
		expect(view.getZoom()).toBe(14);
		await callbacksFlushed();
		expect(external.mock.calls).toEqual([[true]]);
	});

	it("preserves completion order when parallel requests overlap the same property", () => {
		const {mapController, map, media} = runtime();
		const view = map.getView();
		const advance = animationClock();
		mapController.animate({center: [10000, 0], duration: 1000});
		map.dispatchEvent("postrender");
		advance(200, view);
		mapController.animate({center: [20000, 0], duration: 1000});
		map.dispatchEvent("postrender");
		advance(500, view);
		media.matches = true;
		media.dispatchEvent(new Event("change"));
		expect(view.getCenter()).toEqual([20000, 0]);
		expect(view.getAnimating()).toBe(false);
	});

	it("ignores no-op step durations when ordering parallel completion", () => {
		const {map, media} = runtime();
		const view = map.getView();
		const advance = animationClock();
		runWithMotionPreference(map, () =>
			view.animate(
				{center: [10000, 0], duration: 100},
				{center: [10000, 0], duration: 10000},
			),
		);
		runWithMotionPreference(map, () =>
			view.animate({center: [20000, 0], duration: 1000}),
		);
		advance(50, view);
		media.matches = true;
		media.dispatchEvent(new Event("change"));
		expect(view.getCenter()).toEqual([20000, 0]);
		expect(view.getAnimating()).toBe(false);
	});

	it("does not replace the OL method on failure and tolerates matchMedia without change APIs", () => {
		const {map, media} = runtime();
		const view = map.getView();
		const original = view.animateInternal;
		expect(() =>
			runWithMotionPreference(map, () => {
				throw new Error("failure");
			}),
		).toThrow("failure");
		expect(view.animateInternal).toBe(original);
		window.matchMedia = vi.fn(() => ({matches: false}) as MediaQueryList);
		expect(() =>
			runWithMotionPreference(map, () => view.animate({zoom: 11})),
		).not.toThrow();
		media.matches = true;
		media.dispatchEvent(new Event("change"));
		expect(view.getAnimating()).toBe(true);
	});

	it("removes the preference listener on view replacement", () => {
		const {mapController, map, remove} = runtime();
		mapController.animate({zoom: 14, duration: 1000});
		map.dispatchEvent("postrender");
		map.setView(new View({center: [0, 0], zoom: 10}));
		expect(remove).toHaveBeenCalledTimes(1);
	});
});

it.each(["pan", "zoom"])(
	"settles in-flight native keyboard %s before the next reduced-motion step",
	async (kind) => {
		const {map, target, media} = runtime();
		const definition =
			kind === "pan"
				? (
						await import("@/ol-proxy/definitions/interaction/KeyboardPanInteraction")
					).default
				: (
						await import("@/ol-proxy/definitions/interaction/KeyboardZoomInteraction")
					).default;
		const interaction = new definition.Constructor({duration: 1000});
		map.addInteraction(interaction);
		target.tabIndex = 0;
		target.focus();
		const view = map.getView();
		const advance = animationClock();
		const delta = view.getResolution()! * 128;
		const press = () =>
			target.dispatchEvent(
				new window.KeyboardEvent("keydown", {
					key: kind === "pan" ? "ArrowRight" : "+",
					bubbles: true,
				}),
			);
		press();
		advance(500, view);
		expect(view.getAnimating()).toBe(true);
		media.matches = true;
		// Also cover a changed media snapshot before the browser sends change.
		press();
		expect(view.getAnimating()).toBe(false);
		if (kind === "pan") expect(view.getCenter()![0]).toBeCloseTo(delta * 2);
		else expect(view.getZoom()).toBe(12);
		advance(2000, view);
		if (kind === "pan") expect(view.getCenter()![0]).toBeCloseTo(delta * 2);
		else expect(view.getZoom()).toBe(12);
	},
);
