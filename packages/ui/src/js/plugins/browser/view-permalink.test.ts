import {fromLonLat, toLonLat} from "ol/proj";

import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {setLayerVisibility} from "@mapsight/core/lib/map/actions";
import type {MapController} from "@mapsight/core/lib/map/controller";
import type {LayerState} from "@mapsight/core/lib/map/types";

import {create} from "../../index";
import createOlProxyPlugin from "../common/ol-proxy";
import createViewPermalinkPlugin, {
	type AddressAdapter,
	type Options,
	type ViewPermalinkPlugin,
	formatLayersParameter,
	formatViewParameter,
	isUserToggleableLayer,
	lonLatToViewCoordinate,
	parseLayersParameter,
	parseViewParameter,
	planLayerVisibility,
	readAddressParameter,
	trackedLayerIds,
	viewCoordinateToLonLat,
	writeAddressParameters,
} from "./view-permalink";

describe("parseViewParameter / formatViewParameter", () => {
	it("round-trips zoom/lat/lon with default precision", () => {
		const view = {
			zoom: 12.345,
			lat: 52.264712,
			lon: 10.523678,
			rotation: 0,
		};
		const text = formatViewParameter(view);
		expect(text).toBe("12.35/52.26471/10.52368");
		expect(parseViewParameter(text)).toEqual({
			zoom: 12.35,
			lat: 52.26471,
			lon: 10.52368,
			rotation: 0,
		});
	});

	it("honours the coordinate precision and drops trailing zeros", () => {
		expect(
			formatViewParameter({
				zoom: 10,
				lat: 52.5,
				lon: -0.000001,
				rotation: 0,
			}),
		).toBe("10/52.5/0");
		expect(
			formatViewParameter(
				{zoom: 10, lat: 52.123456, lon: 10.987654, rotation: 0},
				2,
			),
		).toBe("10/52.12/10.99");
	});

	it("appends rotation in degrees only when non-zero", () => {
		expect(
			formatViewParameter({zoom: 5, lat: 1, lon: 2, rotation: 90}),
		).toBe("5/1/2/90");
		expect(
			formatViewParameter({zoom: 5, lat: 1, lon: 2, rotation: 0.01}),
		).toBe("5/1/2");
		expect(
			formatViewParameter({zoom: 5, lat: 1, lon: 2, rotation: 270}),
		).toBe("5/1/2/-90");
		expect(parseViewParameter("5/1/2/-90")?.rotation).toBe(-90);
	});

	it("rejects malformed values", () => {
		for (const value of [
			"",
			null,
			undefined,
			"5/1",
			"5/1/2/3/4",
			"a/1/2",
			"5/1/b",
			"5//2",
			"5/1/2/",
			"+5/1/2",
			"5/1e1/2",
			" 5/1/2",
			"5,1,2",
			"NaN/1/2",
			"Infinity/1/2",
		]) {
			expect(parseViewParameter(value), String(value)).toBeNull();
		}
	});

	it("ignores out-of-range values instead of clamping", () => {
		for (const value of [
			"-1/10/10",
			"29/10/10",
			"5/90.1/10",
			"5/-91/10",
			"5/10/180.5",
			"5/10/-181",
			"5/10/10/361",
		]) {
			expect(parseViewParameter(value), value).toBeNull();
		}
		expect(parseViewParameter("0/-90/-180")).not.toBeNull();
		expect(parseViewParameter("28/90/180/360")).not.toBeNull();
	});

	it("refuses to serialise non-finite numbers", () => {
		expect(
			formatViewParameter({
				zoom: Number.NaN,
				lat: 1,
				lon: 2,
				rotation: 0,
			}),
		).toBeNull();
	});
});

describe("parseLayersParameter / formatLayersParameter", () => {
	it("round-trips ids, including ones with special characters", () => {
		const ids = ["base", "points of interest", "a,b", "ü/x"];
		expect(parseLayersParameter(formatLayersParameter(ids))).toEqual(ids);
	});

	it("distinguishes an empty list from a missing parameter", () => {
		expect(parseLayersParameter("")).toEqual([]);
		expect(parseLayersParameter(null)).toBeNull();
		expect(formatLayersParameter([])).toBe("");
	});

	it("rejects malformed values and removes duplicates", () => {
		expect(parseLayersParameter("a,,b")).toBeNull();
		expect(parseLayersParameter("a,%E0%A4%A")).toBeNull();
		expect(parseLayersParameter("a".repeat(5000))).toBeNull();
		expect(parseLayersParameter("a,b,a")).toEqual(["a", "b"]);
	});
});

describe("address parameters", () => {
	it("reads the first matching parameter", () => {
		expect(readAddressParameter("#a=1&map=5/1/2&b=2", "map")).toBe("5/1/2");
		expect(readAddressParameter("?map=5/1/2", "map")).toBe("5/1/2");
		expect(readAddressParameter("#a=1", "map")).toBeNull();
		expect(readAddressParameter("", "map")).toBeNull();
		expect(readAddressParameter("#layers=", "layers")).toBe("");
		expect(readAddressParameter("#xmap=1&mapx=2", "map")).toBeNull();
	});

	it("replaces, appends and removes only the named parameters", () => {
		expect(
			writeAddressParameters("#a=1&map=old&b=%20x", {map: "new"}, "#"),
		).toBe("#a=1&map=new&b=%20x");
		expect(writeAddressParameters("#a=1", {map: "5/1/2"}, "#")).toBe(
			"#a=1&map=5/1/2",
		);
		expect(writeAddressParameters("", {map: "5/1/2"}, "?")).toBe(
			"?map=5/1/2",
		);
		expect(writeAddressParameters("?map=x&a=1", {map: null}, "?")).toBe(
			"?a=1",
		);
		expect(writeAddressParameters("#map=x", {map: null}, "#")).toBe("");
		expect(writeAddressParameters("#/route/x", {map: "1"}, "#")).toBe(
			"#/route/x&map=1",
		);
	});
});

describe("projection helpers", () => {
	it("converts between WGS84 and the view projection", () => {
		const center = lonLatToViewCoordinate(10.5, 52.2)!;

		const back = viewCoordinateToLonLat(center)!;
		expect(back.lon).toBeCloseTo(10.5, 8);
		expect(back.lat).toBeCloseTo(52.2, 8);
	});

	it("returns null for places the projection cannot represent", () => {
		expect(lonLatToViewCoordinate(0, 90)).toBeNull();
		expect(lonLatToViewCoordinate(0, 0, "EPSG:does-not-exist")).toBeNull();
	});
});

describe("layer tracking", () => {
	const layers: Record<string, LayerState> = {
		base: {
			type: "TileLayer",
			metaData: {visibleInLayerSwitcher: true, isBaseLayer: true},
			options: {visible: true},
		},
		pois: {
			type: "TileLayer",
			metaData: {visibleInLayerSwitcher: true},
			options: {visible: false},
		},
		external: {
			type: "TileLayer",
			metaData: {visibleInExternalLayerSwitcher: true},
			options: {visible: true},
		},
		locked: {
			type: "TileLayer",
			metaData: {
				visibleInLayerSwitcher: true,
				lockedInLayerSwitcher: true,
			},
			options: {visible: true},
		},
		derived: {
			type: "TileLayer",
			metaData: {
				visibleInLayerSwitcher: true,
				visibleWhenLayerIds: ["base"],
			},
			options: {visible: true},
		},
		hidden: {type: "TileLayer", metaData: {}, options: {visible: true}},
	};

	it("tracks layers the user can toggle by default", () => {
		expect(trackedLayerIds(layers, undefined)).toEqual([
			"base",
			"pois",
			"external",
		]);
		expect(isUserToggleableLayer(layers.hidden!)).toBe(false);
	});

	it("accepts an id list or a predicate", () => {
		expect(trackedLayerIds(layers, ["hidden", "missing", "pois"])).toEqual([
			"pois",
			"hidden",
		]);
		expect(trackedLayerIds(layers, (id) => id.startsWith("p"))).toEqual([
			"pois",
		]);
	});

	it("plans hides before shows and only for tracked layers", () => {
		expect(
			planLayerVisibility(layers, ["base", "pois", "external"], ["pois"]),
		).toEqual([
			{id: "base", visible: false},
			{id: "external", visible: false},
			{id: "pois", visible: true},
		]);
		expect(
			planLayerVisibility(layers, ["pois"], ["pois", "hidden"]),
		).toEqual([{id: "pois", visible: true}]);
	});
});

// ---------------------------------------------------------------------------
// Integration with a real store
// ---------------------------------------------------------------------------

const tile = (
	visible: boolean,
	metaData: LayerState["metaData"] = {},
): LayerState => ({
	type: "TileLayer",
	metaData,
	options: {visible, source: {type: "OsmSource", options: {}}},
});

const defaultLayers = () => ({
	baseA: tile(true, {isBaseLayer: true, visibleInLayerSwitcher: true}),
	baseB: tile(false, {isBaseLayer: true, visibleInLayerSwitcher: true}),
	poi: tile(true, {visibleInLayerSwitcher: true}),
	parks: tile(false, {visibleInLayerSwitcher: true}),
	internal: tile(true, {}),
});

const DEBOUNCE = 250;
const STATE_SYNC = 350;

type Setup = ReturnType<typeof setup>;
const instances: ViewPermalinkPlugin[] = [];

function setup({
	url = "/page",
	options = {},
	layers = defaultLayers(),
	view = {center: fromLonLat([10, 52]), zoom: 8},
}: {
	url?: string;
	options?: Options;
	layers?: Record<string, LayerState>;
	view?: Record<string, unknown>;
} = {}) {
	window.history.replaceState({keep: true}, "", url);
	const plugin = createViewPermalinkPlugin({
		debounceMs: DEBOUNCE,
		...options,
	});
	instances.push(plugin);
	const context = create(
		null,
		vi.fn(),
		{map: {layers, view}},
		{
			renderer: vi.fn(),
			validateConfig: false,
			plugins: [
				["olProxy", createOlProxyPlugin()],
				["viewPermalink", plugin],
			],
		},
	);
	const store = context.store!;
	const map = (store.getController("map") as MapController).getMap()!;
	const view_ = map.getView();
	const visible = (id: string) =>
		(
			store.getState() as {
				map: {layers: Record<string, LayerState>};
			}
		).map.layers[id]?.options?.visible;
	return {context, store, map, view: view_, plugin, visible};
}

/** Move the view and let the state follow (throttled) and the debounce elapse. */
function moveView(s: Setup, lon: number, lat: number, zoom: number) {
	s.view.setCenter(fromLonLat([lon, lat]));
	s.view.setZoom(zoom);
	vi.advanceTimersByTime(STATE_SYNC); // throttled view-to-state sync
	vi.advanceTimersByTime(DEBOUNCE);
}

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	for (const plugin of instances.splice(0)) {
		plugin.destroy();
	}
	vi.useRealTimers();
	vi.restoreAllMocks();
	window.history.replaceState(null, "", "/");
});

describe("startup restore", () => {
	it("starts at the linked view without animating from the configured one", () => {
		const s = setup({url: "/page#map=12.5/48.13743/11.57549"});
		const center = toLonLat(s.view.getCenter()!);
		expect(center[0]).toBeCloseTo(11.57549, 6);
		expect(center[1]).toBeCloseTo(48.13743, 6);
		expect(s.view.getZoom()).toBeCloseTo(12.5, 6);
		expect(s.view.getAnimating()).toBe(false);
		expect(s.view.getRotation()).toBe(0);
	});

	it("restores rotation and replaces a configured resolution", () => {
		const s = setup({
			url: "/page#map=6/50/9/90",
			view: {center: fromLonLat([10, 52]), resolution: 5000},
		});
		expect(s.view.getZoom()).toBeCloseTo(6, 6);
		expect(s.view.getRotation()).toBeCloseTo(Math.PI / 2, 6);
	});

	it("keeps the configured view when the address names none or is invalid", () => {
		for (const url of [
			"/page",
			"/page#other=1",
			"/page#map=garbage",
			"/page#map=40/1/2",
			"/page#map=5/95/2",
		]) {
			const s = setup({url});
			const center = toLonLat(s.view.getCenter()!);
			expect(center[0], url).toBeCloseTo(10, 6);
			expect(center[1], url).toBeCloseTo(52, 6);
			expect(s.view.getZoom(), url).toBe(8);
		}
	});

	it("ignores a linked zoom outside the configured limits", () => {
		const s = setup({
			url: "/page#map=3/50/9",
			view: {center: fromLonLat([10, 52]), zoom: 8, minZoom: 5},
		});
		expect(s.view.getZoom()).toBe(8);
	});

	it("reads the query string in search mode", () => {
		const s = setup({
			url: "/page?x=1&map=9/48/11#map=2/0/0",
			options: {location: "search"},
		});
		expect(s.view.getZoom()).toBeCloseTo(9, 6);
	});

	it("does not touch the view when the view parameter is disabled", () => {
		const s = setup({
			url: "/page#map=12/48/11",
			options: {viewParameter: false},
		});
		expect(s.view.getZoom()).toBe(8);
	});

	it("does not write on startup", () => {
		const replace = vi.spyOn(window.history, "replaceState");
		setup({url: "/page#map=12/48/11&layers=poi"});
		vi.advanceTimersByTime(2000);
		expect(replace).toHaveBeenCalledTimes(1); // only the test's own setup
	});
});

describe("layer restore", () => {
	it("shows listed tracked layers and hides the other tracked ones", () => {
		const s = setup({url: "/page#layers=baseB,parks"});
		expect(s.visible("baseB")).toBe(true);
		expect(s.visible("baseA")).toBe(false);
		expect(s.visible("parks")).toBe(true);
		expect(s.visible("poi")).toBe(false);
	});

	it("never touches untracked layers", () => {
		const s = setup({url: "/page#layers=parks"});
		expect(s.visible("internal")).toBe(true);
	});

	it("ignores unknown ids and never creates layers", () => {
		const s = setup({url: "/page#layers=parks,nope,internal"});
		const layers = (
			s.store.getState() as {map: {layers: Record<string, LayerState>}}
		).map.layers;
		expect(Object.keys(layers).sort()).toEqual(
			["baseA", "baseB", "internal", "parks", "poi"].sort(),
		);
		// "internal" is not tracked, so listing it changes nothing
		expect(s.visible("internal")).toBe(true);
		expect(s.visible("parks")).toBe(true);
		expect(s.visible("poi")).toBe(false);
	});

	it("keeps a single visible base layer when several are listed", () => {
		const s = setup({url: "/page#layers=baseA,baseB,poi"});
		const visibleBases = ["baseA", "baseB"].filter((id) => s.visible(id));
		expect(visibleBases).toEqual(["baseB"]);
	});

	it("hides all tracked layers for an empty list", () => {
		const s = setup({url: "/page#layers="});
		expect(s.visible("baseA")).toBe(false);
		expect(s.visible("poi")).toBe(false);
		expect(s.visible("internal")).toBe(true);
	});

	it("leaves layers alone without the parameter or with a malformed one", () => {
		for (const url of ["/page", "/page#layers=a,,b", "/page#map=5/1/2"]) {
			const s = setup({url});
			expect(s.visible("baseA"), url).toBe(true);
			expect(s.visible("poi"), url).toBe(true);
			expect(s.visible("parks"), url).toBe(false);
		}
	});

	it("honours an explicit id list and predicate", () => {
		const a = setup({
			url: "/page#layers=internal",
			options: {trackedLayers: ["internal", "parks"]},
		});
		expect(a.visible("internal")).toBe(true);
		expect(a.visible("parks")).toBe(false);
		expect(a.visible("poi")).toBe(true);

		const b = setup({
			url: "/page#layers=parks",
			options: {trackedLayers: (id) => id === "poi" || id === "parks"},
		});
		expect(b.visible("poi")).toBe(false);
		expect(b.visible("baseA")).toBe(true);
	});

	it("does not touch layers when the layers parameter is disabled", () => {
		const s = setup({
			url: "/page#layers=parks",
			options: {layersParameter: false},
		});
		expect(s.visible("parks")).toBe(false);
		expect(s.visible("poi")).toBe(true);
	});
});

describe("writing", () => {
	it("writes the debounced state once with replaceState", () => {
		const s = setup({url: "/page?q=1"});
		const replace = vi.spyOn(window.history, "replaceState");
		const push = vi.spyOn(window.history, "pushState");

		s.view.setCenter(fromLonLat([11.5, 48.1]));
		s.view.setZoom(10.126);
		vi.advanceTimersByTime(STATE_SYNC);
		vi.advanceTimersByTime(DEBOUNCE - 50);
		expect(replace).not.toHaveBeenCalled();
		vi.advanceTimersByTime(100);

		expect(replace).toHaveBeenCalledTimes(1);
		expect(push).not.toHaveBeenCalled();
		expect(window.location.search).toBe("?q=1");
		expect(window.location.hash).toBe(
			"#map=10.13/48.1/11.5&layers=baseA,poi",
		);
		expect(window.history.state).toEqual({keep: true});
	});

	it("serialises rotation only when non-zero", () => {
		const s = setup();
		s.view.setRotation(Math.PI / 2);
		moveView(s, 10, 52, 8);
		expect(window.location.hash).toContain("map=8/52/10/90");
		s.view.setRotation(0);
		moveView(s, 10, 52, 9);
		expect(window.location.hash).toContain("map=9/52/10&");
	});

	it("writes layer changes and keeps the view in the same link", () => {
		const s = setup();
		s.store.dispatch(setLayerVisibility("map", "parks", true) as never);
		s.store.dispatch(setLayerVisibility("map", "poi", false) as never);
		vi.advanceTimersByTime(DEBOUNCE);
		expect(window.location.hash).toBe("#map=8/52/10&layers=baseA,parks");
	});

	it("writes an empty list when every tracked layer is hidden", () => {
		const s = setup();
		s.store.dispatch(setLayerVisibility("map", "baseA", false) as never);
		s.store.dispatch(setLayerVisibility("map", "poi", false) as never);
		vi.advanceTimersByTime(DEBOUNCE);
		expect(readAddressParameter(window.location.hash, "layers")).toBe("");
	});

	it("does not write when the serialised state is unchanged", () => {
		const s = setup({url: "/page#map=8/52/10&layers=baseA,poi"});
		const replace = vi.spyOn(window.history, "replaceState");
		// same layer state again, view jiggle that rounds to the same text
		s.store.dispatch(setLayerVisibility("map", "poi", true) as never);
		s.view.setCenter(fromLonLat([10.000000001, 52]));
		vi.advanceTimersByTime(STATE_SYNC + DEBOUNCE);
		expect(replace).not.toHaveBeenCalled();
	});

	it("does not rewrite an address that already holds the state", () => {
		const s = setup({url: "/page#layers=poi,baseA"});
		const replace = vi.spyOn(window.history, "replaceState");
		s.store.dispatch(setLayerVisibility("map", "parks", true) as never);
		s.store.dispatch(setLayerVisibility("map", "parks", false) as never);
		vi.advanceTimersByTime(DEBOUNCE);
		expect(replace).not.toHaveBeenCalled();
	});

	it("preserves unrelated hash parameters", () => {
		const s = setup({url: "/page?q=1#a=1&map=3/1/1&b=x%20y"});
		moveView(s, 11, 48, 9);
		expect(window.location.hash).toBe(
			"#a=1&map=9/48/11&b=x%20y&layers=baseA,poi",
		);
		expect(window.location.search).toBe("?q=1");
	});

	it("preserves unrelated query parameters and the hash in search mode", () => {
		const s = setup({
			url: "/page?q=1&map=3/1/1&z=%2F#section",
			options: {location: "search"},
		});
		moveView(s, 11, 48, 9);
		expect(window.location.search).toBe(
			"?q=1&map=9/48/11&z=%2F&layers=baseA,poi",
		);
		expect(window.location.hash).toBe("#section");
		expect(window.location.pathname).toBe("/page");
		s.store.dispatch(setLayerVisibility("map", "parks", true) as never);
		vi.advanceTimersByTime(DEBOUNCE);
		expect(window.location.search).toContain("layers=baseA,poi,parks");
	});

	it("uses custom parameter names and can disable one part", () => {
		const s = setup({
			options: {viewParameter: "v", layersParameter: false},
		});
		moveView(s, 11, 48, 9);
		expect(window.location.hash).toBe("#v=9/48/11");
		s.store.dispatch(setLayerVisibility("map", "parks", true) as never);
		vi.advanceTimersByTime(DEBOUNCE);
		expect(window.location.hash).toBe("#v=9/48/11");
	});

	it("honours the coordinate precision option", () => {
		const s = setup({options: {precision: 2}});
		moveView(s, 11.56789, 48.12345, 9);
		expect(window.location.hash).toContain("map=9/48.12/11.57");
	});

	it("stops writing after destroy", () => {
		const s = setup();
		s.plugin.destroy();
		moveView(s, 11, 48, 9);
		expect(window.location.hash).toBe("");
	});
});

describe("custom adapter", () => {
	function memoryAdapter(initial = "") {
		let value = initial;
		const adapter: AddressAdapter & {writes: string[]} = {
			writes: [],
			read: () => value,
			write(next) {
				adapter.writes.push(next);
				value = next;
			},
		};
		return adapter;
	}

	it("reads and writes through the adapter, not window.location", () => {
		const adapter = memoryAdapter("#route=1&map=12/48/11&layers=parks");
		const s = setup({options: {adapter}});
		expect(s.view.getZoom()).toBeCloseTo(12, 6);
		expect(s.visible("parks")).toBe(true);
		expect(s.visible("poi")).toBe(false);

		moveView(s, 12, 49, 13);
		expect(adapter.writes).toEqual(["#route=1&map=13/49/12&layers=parks"]);
		expect(window.location.hash).toBe("");
	});

	it("passes the prefix of the configured location", () => {
		const adapter = memoryAdapter("");
		const s = setup({options: {adapter, location: "search"}});
		moveView(s, 12, 49, 13);
		expect(adapter.writes[0]).toMatch(/^\?map=/);
	});
});

describe("following address changes", () => {
	function renderOnce(s: Setup) {
		// The queued animation runs on the first frame with a known size.
		s.map.setSize([800, 600]);
		s.map.dispatchEvent("postrender");
	}

	it("applies a changed view and layers on hashchange", () => {
		const s = setup();
		window.history.replaceState(
			null,
			"",
			"/page#map=11/48.5/11.25&layers=parks",
		);
		window.dispatchEvent(new HashChangeEvent("hashchange"));
		renderOnce(s);

		const center = toLonLat(s.view.getCenter()!);
		expect(center[0]).toBeCloseTo(11.25, 6);
		expect(center[1]).toBeCloseTo(48.5, 6);
		expect(s.view.getZoom()).toBeCloseTo(11, 6);
		expect(s.visible("parks")).toBe(true);
		expect(s.visible("poi")).toBe(false);
	});

	it("applies address changes on popstate", () => {
		const s = setup();
		window.history.replaceState(null, "", "/page#layers=parks");
		window.dispatchEvent(new PopStateEvent("popstate"));
		expect(s.visible("parks")).toBe(true);
		expect(s.visible("baseA")).toBe(false);
	});

	it("ignores invalid values and unrelated changes", () => {
		const s = setup();
		window.history.replaceState(
			null,
			"",
			"/page#map=99/1/2&layers=a,,b&other=1",
		);
		window.dispatchEvent(new HashChangeEvent("hashchange"));
		renderOnce(s);
		expect(s.view.getZoom()).toBe(8);
		expect(s.visible("poi")).toBe(true);
	});

	it("does not follow when disabled", () => {
		const s = setup({options: {followAddressChanges: false}});
		window.history.replaceState(null, "", "/page#layers=parks");
		window.dispatchEvent(new HashChangeEvent("hashchange"));
		window.dispatchEvent(new PopStateEvent("popstate"));
		expect(s.visible("parks")).toBe(false);
	});

	it("stops following after destroy", () => {
		const s = setup();
		s.plugin.destroy();
		window.history.replaceState(null, "", "/page#layers=parks");
		window.dispatchEvent(new HashChangeEvent("hashchange"));
		expect(s.visible("parks")).toBe(false);
	});

	it("does not loop between writing and following", () => {
		const s = setup();
		const replace = vi.spyOn(window.history, "replaceState");
		const dispatch = vi.spyOn(s.store, "dispatch");

		// our own write, followed by the events a router might emit for it
		s.store.dispatch(setLayerVisibility("map", "parks", true) as never);
		vi.advanceTimersByTime(DEBOUNCE);
		expect(replace).toHaveBeenCalledTimes(1);
		const written = window.location.hash;

		dispatch.mockClear();
		window.dispatchEvent(new HashChangeEvent("hashchange"));
		window.dispatchEvent(new PopStateEvent("popstate"));
		vi.advanceTimersByTime(2000);

		expect(dispatch).not.toHaveBeenCalled();
		expect(replace).toHaveBeenCalledTimes(1);
		expect(window.location.hash).toBe(written);
	});

	it("settles after applying an address without writing it back repeatedly", () => {
		setup();
		const replace = vi.spyOn(window.history, "replaceState");
		window.history.replaceState(null, "", "/page#layers=baseA,parks");
		replace.mockClear();
		window.dispatchEvent(new HashChangeEvent("hashchange"));
		vi.advanceTimersByTime(5000);
		// the state now equals the address, so nothing needs to be written
		expect(replace).not.toHaveBeenCalled();
		expect(window.location.hash).toBe("#layers=baseA,parks");
	});
});
