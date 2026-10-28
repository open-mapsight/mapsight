import Feature from "ol/Feature";
import Point from "ol/geom/Point";

import {afterEach, describe, expect, it, vi} from "vitest";

import {animate} from "@/lib/map/actions";
import {createHighlightTestMap} from "@/test/create-highlight-test-map";

import runWithMotionPreference from "./runWithMotionPreference";

const cleanup: Array<() => void> = [];
afterEach(() => {
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
