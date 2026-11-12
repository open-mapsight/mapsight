import {fromLonLat, toLonLat} from "ol/proj";

import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {ANIMATE, setLayerVisibility} from "@mapsight/core/lib/map/actions";
import type {MapController} from "@mapsight/core/lib/map/controller";
import type {LayerState} from "@mapsight/core/lib/map/types";

import {create} from "../../index";
import type {CreateOptions, PluginDefinition} from "../../types";
import createOlProxyPlugin from "../common/ol-proxy";
import createFeatureDeepLinkPlugin from "./feature-deep-link";
import {markedPointSourceId} from "./marked-point";
import createSharePositionPlugin from "./share-position-link";
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

	it("normalises longitudes of repeated worlds into the accepted range", () => {
		const lonOf = (lon: number) =>
			parseViewParameter(
				formatViewParameter({zoom: 5, lat: 1, lon, rotation: 0}),
			)?.lon;
		expect(lonOf(540)).toBe(180);
		expect(lonOf(-540)).toBe(180);
		expect(lonOf(190)).toBe(-170);
		expect(lonOf(-190.5)).toBe(169.5);
		expect(lonOf(720.25)).toBe(0.25);
		expect(lonOf(180)).toBe(180);
		expect(lonOf(-180)).toBe(180);
		expect(lonOf(0)).toBe(0);
	});

	it("returns null for values the parser would reject", () => {
		for (const view of [
			{zoom: -0.5, lat: 1, lon: 2, rotation: 0},
			{zoom: 28.5, lat: 1, lon: 2, rotation: 0},
			{zoom: 5, lat: 90.5, lon: 2, rotation: 0},
			{zoom: 5, lat: -91, lon: 2, rotation: 0},
		]) {
			expect(formatViewParameter(view), JSON.stringify(view)).toBeNull();
		}
	});

	it("only produces text the parser accepts (property check)", () => {
		// Deterministic pseudo-random generator, so failures are reproducible.
		let seed = 20240607;
		const random = () => {
			seed = (seed * 1664525 + 1013904223) % 4294967296;
			return seed / 4294967296;
		};
		const between = (min: number, max: number) =>
			min + random() * (max - min);
		const edges = [0, 0.5, 28, -0, 89.999999, 179.999999, 180, 360, 1e6];
		for (let i = 0; i < 3000; i++) {
			const view = {
				zoom: random() < 0.1 ? between(-2, 31) : between(0, 28),
				lat: random() < 0.1 ? between(-100, 100) : between(-90, 90),
				lon: random() < 0.5 ? between(-180, 180) : between(-5000, 5000),
				rotation: between(-2000, 2000),
			};
			if (random() < 0.2) {
				const edge = edges[Math.floor(random() * edges.length)]!;
				const sign = random() < 0.5 ? -1 : 1;
				view[(["zoom", "lat", "lon", "rotation"] as const)[i % 4]!] =
					sign * edge;
			}
			const precision = Math.floor(random() * 11);
			const text = formatViewParameter(view, precision);
			if (text === null) {
				// Only unrepresentable zoom or latitude may be refused.
				expect(
					view.zoom < 0 ||
						view.zoom > 28.005 ||
						Math.abs(view.lat) > 89.5,
					JSON.stringify(view),
				).toBe(true);
				continue;
			}
			const parsed = parseViewParameter(text);
			expect(parsed, `${text} <- ${JSON.stringify(view)}`).not.toBeNull();
			const expectedLon = ((((view.lon + 180) % 360) + 360) % 360) - 180;
			const tolerance = 10 ** -precision;
			const lonDelta = Math.abs(
				((((parsed!.lon - expectedLon + 180) % 360) + 360) % 360) - 180,
			);
			expect(lonDelta, text).toBeLessThanOrEqual(tolerance);
		}
	});
});

describe("parseLayersParameter / formatLayersParameter", () => {
	it("round-trips ids, including ones with special characters", () => {
		const ids = [
			"base",
			"points of interest",
			"50%",
			"a&b",
			"k=v",
			"x+y",
			"#1?",
			"ü/x",
			"日本",
		];
		const text = formatLayersParameter(ids)!;
		expect(text).not.toMatch(/[&=#? ]/);
		expect(parseLayersParameter(text)).toEqual(ids);
	});

	it("decodes the value once as a whole and splits on commas afterwards", () => {
		for (const text of ["base,parks", "base%2Cparks", "base%2cparks"]) {
			expect(parseLayersParameter(text), text).toEqual(["base", "parks"]);
		}
		// decoded exactly once: the percent sign survives as part of the id
		expect(parseLayersParameter("a%2520b")).toEqual(["a%20b"]);
		// query serialisation spells a space as "+"
		expect(parseLayersParameter("my+layer,x%20y")).toEqual([
			"my layer",
			"x y",
		]);
	});

	it("cannot represent ids that contain a comma", () => {
		expect(formatLayersParameter(["a,b"])).toBeNull();
		expect(formatLayersParameter(["ok", "a,b"])).toBeNull();
	});

	it("refuses to format lists the parser would reject as too long", () => {
		const ids = Array.from(
			{length: 60},
			(_, i) => `${i}-${"x".repeat(78)}`,
		);
		expect(formatLayersParameter(ids.slice(0, 40))).not.toBeNull();
		expect(formatLayersParameter(ids)).toBeNull();
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

	it("lets the first listed base layer win and treats the others as not listed", () => {
		const bases: Record<string, LayerState> = {
			a: {...layers.base!, options: {visible: true}},
			b: {...layers.base!, options: {visible: false}},
			pois: layers.pois!,
		};
		const tracked = ["a", "b", "pois"];
		expect(planLayerVisibility(bases, tracked, ["a", "b", "pois"])).toEqual(
			[{id: "pois", visible: true}],
		);
		expect(planLayerVisibility(bases, tracked, ["pois", "b", "a"])).toEqual(
			[
				{id: "a", visible: false},
				{id: "b", visible: true},
				{id: "pois", visible: true},
			],
		);
	});

	it("never tracks ids that contain a comma", () => {
		const commas: Record<string, LayerState> = {
			"a,b": layers.pois!,
			ok: layers.pois!,
		};
		expect(trackedLayerIds(commas, undefined)).toEqual(["ok"]);
		expect(trackedLayerIds(commas, ["a,b", "ok"])).toEqual(["ok"]);
		expect(trackedLayerIds(commas, () => true)).toEqual(["ok"]);
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
	historyState = {keep: true},
	pluginsBefore = [],
	pluginsAfter = [],
	createOptions = {},
}: {
	url?: string;
	options?: Options;
	layers?: Record<string, LayerState>;
	view?: Record<string, unknown>;
	historyState?: unknown;
	/** Plugins listed before / after the permalink plugin. */
	pluginsBefore?: PluginDefinition[];
	pluginsAfter?: PluginDefinition[];
	createOptions?: CreateOptions;
} = {}) {
	window.history.replaceState(historyState, "", url);
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
				...pluginsBefore,
				["viewPermalink", plugin],
				...pluginsAfter,
			],
			...createOptions,
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

	it("applies the link to a view that configures neither centre nor zoom", () => {
		const s = setup({url: "/page#map=12/48/11", view: {}});
		const center = toLonLat(s.view.getCenter()!);
		expect(center[0]).toBeCloseTo(11, 6);
		expect(center[1]).toBeCloseTo(48, 6);
		expect(s.view.getZoom()).toBeCloseTo(12, 6);
	});

	it("applies the link when the live view differs from the configured state", () => {
		// zoom and resolution configured together: the resolution wins in the
		// view, so a link to the configured zoom still has to move it
		const s = setup({
			url: "/page#map=8/52/10",
			view: {center: fromLonLat([10, 52]), zoom: 8, resolution: 1000},
		});
		expect(s.view.getZoom()).toBeCloseTo(8, 6);
	});

	it("reads the query string in search mode", () => {
		const s = setup({
			url: "/page?x=1&map=9/48/11#map=2/0/0",
			options: {location: "search"},
		});
		expect(s.view.getZoom()).toBeCloseTo(9, 6);
	});

	it("reads a view whose slashes were percent-encoded by a router", () => {
		const hash = setup({url: "/page#map=12%2F48%2F11%2F90"});
		expect(hash.view.getZoom()).toBeCloseTo(12, 6);
		expect(hash.view.getRotation()).toBeCloseTo(Math.PI / 2, 6);
		const search = setup({
			url: "/page?map=9%2F48%2F11",
			options: {location: "search"},
		});
		expect(search.view.getZoom()).toBeCloseTo(9, 6);
	});

	it("does not touch the view when the view parameter is disabled", () => {
		const s = setup({
			url: "/page#map=12/48/11",
			options: {viewParameter: false},
		});
		expect(s.view.getZoom()).toBe(8);
	});

	it("keeps the hydration snapshot free of the linked view and applies it before mounting", () => {
		const renderer = vi.fn();
		const hydrated = (url: string) =>
			setup({
				url,
				createOptions: {reHydratedState: {app: {}}, renderer},
			});
		const plain = hydrated("/page");
		const linked = hydrated("/page#map=12/48/11&layers=parks");

		expect(linked.context.isStateReHydrated).toBe(true);
		expect(linked.context.serverState).toEqual(plain.context.serverState);
		const snapshotView = (
			linked.context.serverState as {
				map: {view: {zoom: number; center: number[]}};
			}
		).map.view;
		expect(snapshotView.zoom).toBe(8);
		expect(snapshotView.center).toEqual(fromLonLat([10, 52]));

		// The live state and the map carry the link, before anything is mounted.
		const liveView = (
			linked.store.getState() as {map: {view: {zoom: number}}}
		).map.view;
		expect(liveView.zoom).toBe(12);
		expect(linked.visible("parks")).toBe(true);
		const center = toLonLat(linked.view.getCenter()!);
		expect(center[0]).toBeCloseTo(11, 6);
		expect(center[1]).toBeCloseTo(48, 6);
		expect(linked.view.getZoom()).toBeCloseTo(12, 6);
		expect(linked.view.getAnimating()).toBe(false);
		expect(renderer).not.toHaveBeenCalled();
		expect(linked.context.hasRendered).toBe(false);
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

	it("lets the first listed base layer win, whatever is visible now", () => {
		const visibleBases = (s: Setup) =>
			["baseA", "baseB"].filter((id) => s.visible(id));
		const baseBVisible = () => ({
			...defaultLayers(),
			baseA: tile(false, {
				isBaseLayer: true,
				visibleInLayerSwitcher: true,
			}),
			baseB: tile(true, {
				isBaseLayer: true,
				visibleInLayerSwitcher: true,
			}),
		});
		for (const [list, expected] of [
			["baseA,baseB,poi", "baseA"],
			["baseB,baseA,poi", "baseB"],
			["poi,baseB,baseA", "baseB"],
		] as const) {
			const fromA = setup({url: `/page#layers=${list}`});
			expect(visibleBases(fromA), `${list} from baseA`).toEqual([
				expected,
			]);
			const fromB = setup({
				url: `/page#layers=${list}`,
				layers: baseBVisible(),
			});
			expect(visibleBases(fromB), `${list} from baseB`).toEqual([
				expected,
			]);
			expect(fromB.visible("poi"), list).toBe(true);
		}
	});

	it("reads a percent-encoded comma as a list separator", () => {
		const s = setup({url: "/page#layers=baseB%2Cparks"});
		expect(s.visible("baseB")).toBe(true);
		expect(s.visible("baseA")).toBe(false);
		expect(s.visible("parks")).toBe(true);
		expect(s.visible("poi")).toBe(false);
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

	it("skips the layers parameter instead of throwing when the list is too long", () => {
		const longIds = Array.from(
			{length: 60},
			(_, i) => `${i}-${"x".repeat(78)}`,
		);
		const layers: Record<string, LayerState> = {...defaultLayers()};
		for (const id of longIds) {
			layers[id] = tile(false, {visibleInLayerSwitcher: true});
		}
		const s = setup({layers});
		const show = (id: string, visible: boolean) =>
			s.store.dispatch(setLayerVisibility("map", id, visible) as never);
		show("parks", true);
		vi.advanceTimersByTime(DEBOUNCE);
		expect(window.location.hash).toBe(
			"#map=8/52/10&layers=baseA,poi,parks",
		);

		// too many visible layers for one parameter: no throw, value untouched
		for (const id of longIds) {
			show(id, true);
		}
		expect(() => vi.advanceTimersByTime(DEBOUNCE)).not.toThrow();
		expect(window.location.hash).toBe(
			"#map=8/52/10&layers=baseA,poi,parks",
		);

		// the view parameter keeps working meanwhile
		expect(() => moveView(s, 11, 48, 9)).not.toThrow();
		expect(window.location.hash).toBe(
			"#map=9/48/11&layers=baseA,poi,parks",
		);

		// representable again: the layers parameter follows
		for (const id of longIds.slice(1)) {
			show(id, false);
		}
		vi.advanceTimersByTime(DEBOUNCE);
		expect(readAddressParameter(window.location.hash, "layers")).toBe(
			`baseA,poi,parks,${longIds[0]}`,
		);
	});

	it("never writes ids that contain a comma", () => {
		const s = setup({
			layers: {
				...defaultLayers(),
				"x,y": tile(true, {visibleInLayerSwitcher: true}),
			},
		});
		moveView(s, 11, 48, 9);
		expect(window.location.hash).toBe("#map=9/48/11&layers=baseA,poi");
	});

	it("writes a readable link for a centre in a repeated world", () => {
		const s = setup();
		// seven world widths east of the origin: proj4 reports a longitude near 900
		s.view.setCenter([
			fromLonLat([180, 0])[0]! * 7,
			fromLonLat([0, 40])[1]!,
		]);
		s.view.setZoom(4);
		vi.advanceTimersByTime(STATE_SYNC + DEBOUNCE);
		const view = parseViewParameter(
			readAddressParameter(window.location.hash, "map"),
		);
		expect(view).not.toBeNull();
		expect(Math.abs(view!.lon)).toBe(180);
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

	it("ignores address changes caused synchronously by its own write", () => {
		let value = "";
		const adapter: AddressAdapter = {
			read: () => value,
			write(next) {
				value = next;
				window.dispatchEvent(new PopStateEvent("popstate"));
				window.dispatchEvent(new HashChangeEvent("hashchange"));
			},
		};
		const s = setup({options: {adapter}});
		const dispatch = vi.spyOn(s.store, "dispatch");

		s.view.setCenter(fromLonLat([11.123456789, 48.987654321]));
		s.view.setZoom(10.1234);
		vi.advanceTimersByTime(STATE_SYNC + DEBOUNCE);
		expect(value).toContain("map=10.12/48.98765/11.12346");

		// the rounded values must not have been applied to the live view
		s.map.setSize([800, 600]);
		s.map.dispatchEvent("postrender");
		const center = toLonLat(s.view.getCenter()!);
		expect(center[0]).toBeCloseTo(11.123456789, 9);
		expect(center[1]).toBeCloseTo(48.987654321, 9);
		expect(s.view.getZoom()).toBeCloseTo(10.1234, 9);
		expect(
			dispatch.mock.calls.filter(
				([action]) => (action as {type?: string}).type === ANIMATE,
			),
		).toEqual([]);
	});

	it("does not re-apply a router's re-spelling of what it wrote", () => {
		// a router that round-trips the query through URLSearchParams
		let value = "";
		const adapter: AddressAdapter = {
			read: () => value,
			write(next) {
				const params = new URLSearchParams(next.replace(/^[?#]/, ""));
				value = `?${params.toString()}`;
				window.dispatchEvent(new PopStateEvent("popstate"));
			},
		};
		const s = setup({options: {adapter, location: "search"}});
		const dispatch = vi.spyOn(s.store, "dispatch");
		s.store.dispatch(setLayerVisibility("map", "parks", true) as never);
		dispatch.mockClear();
		vi.advanceTimersByTime(DEBOUNCE);
		expect(value).toContain("layers=baseA%2Cpoi%2Cparks");
		window.dispatchEvent(new PopStateEvent("popstate"));
		expect(dispatch).not.toHaveBeenCalled();
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

	it("drops a pending write when the address changes before the map can render", () => {
		const s = setup();
		// the user moves the map: a write is now scheduled
		s.view.setCenter(fromLonLat([11, 48]));
		s.view.setZoom(9);
		vi.advanceTimersByTime(STATE_SYNC);

		// back/forward navigates to another address; the map has no size yet
		window.history.replaceState(null, "", "/page#map=11/48.5/11.25");
		window.dispatchEvent(new PopStateEvent("popstate"));
		vi.advanceTimersByTime(2000);

		expect(window.location.hash).toBe("#map=11/48.5/11.25");
		const center = toLonLat(s.view.getCenter()!);
		expect(center[0]).toBeCloseTo(11.25, 6);
		expect(center[1]).toBeCloseTo(48.5, 6);
		expect(s.view.getZoom()).toBeCloseTo(11, 6);
	});

	it("drops a pending layer write when the address changes", () => {
		const s = setup();
		s.store.dispatch(setLayerVisibility("map", "parks", true) as never);
		window.history.replaceState(null, "", "/page#map=11/48.5/11.25");
		window.dispatchEvent(new PopStateEvent("popstate"));
		vi.advanceTimersByTime(2000);
		expect(window.location.hash).toBe("#map=11/48.5/11.25");
	});

	it("follows a router's re-spelling of the address without applying it", () => {
		const s = setup({url: "/page?x=1", options: {location: "search"}});
		moveView(s, 11, 48, 9);
		const written = window.location.search;
		const respelled = `?${new URLSearchParams(written).toString()}`;
		expect(respelled).not.toBe(written);
		const dispatch = vi.spyOn(s.store, "dispatch");
		window.history.replaceState(null, "", `/page${respelled}`);
		window.dispatchEvent(new PopStateEvent("popstate"));
		vi.advanceTimersByTime(2000);
		expect(dispatch).not.toHaveBeenCalled();
		expect(window.location.search).toBe(respelled);
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

describe("router round trips", () => {
	const specialIds = ["50%", "a&b", "k=v", "my layer", "ü/ö 日本", "x+y"];
	const specialLayers = (visible: boolean) => ({
		...defaultLayers(),
		...Object.fromEntries(
			specialIds.map((id) => [
				id,
				tile(visible, {visibleInLayerSwitcher: true}),
			]),
		),
	});

	for (const location of ["hash", "search"] as const) {
		const prefix = location === "hash" ? "#" : "?";
		const current = () =>
			location === "hash" ? window.location.hash : window.location.search;
		const roundTrip = (address: string) =>
			`${prefix}${new URLSearchParams(address.slice(1)).toString()}`;

		it(`restores ids and view from a URLSearchParams re-spelling (${location})`, () => {
			const writer = setup({
				layers: specialLayers(true),
				options: {location},
			});
			moveView(writer, 11, 48, 9);
			const written = current();
			const respelled = roundTrip(written);
			expect(respelled).not.toBe(written);
			// the readable form is what the plugin itself writes
			expect(written).not.toMatch(/%2[Cc]/);
			expect(respelled).toContain("%2C");

			for (const address of [written, respelled]) {
				const reader = setup({
					url:
						location === "hash"
							? `/page${address}`
							: `/page${address}`,
					layers: specialLayers(false),
					options: {location},
				});
				for (const id of ["baseA", "poi", ...specialIds]) {
					expect(reader.visible(id), `${id} from ${address}`).toBe(
						true,
					);
				}
				expect(reader.view.getZoom(), address).toBeCloseTo(9, 6);
				const center = toLonLat(reader.view.getCenter()!);
				expect(center[0], address).toBeCloseTo(11, 5);
				expect(center[1], address).toBeCloseTo(48, 5);
			}
		});

		it(`treats a re-spelled address as unchanged (${location})`, () => {
			const s = setup({layers: specialLayers(true), options: {location}});
			moveView(s, 11, 48, 9);
			const replace = vi.spyOn(window.history, "replaceState");
			const dispatch = vi.spyOn(s.store, "dispatch");
			window.history.replaceState(
				null,
				"",
				`/page${roundTrip(current())}`,
			);
			replace.mockClear();
			window.dispatchEvent(new PopStateEvent("popstate"));
			window.dispatchEvent(new HashChangeEvent("hashchange"));
			vi.advanceTimersByTime(2000);
			expect(dispatch).not.toHaveBeenCalled();
			expect(replace).not.toHaveBeenCalled();
			for (const id of specialIds) {
				expect(s.visible(id), id).toBe(true);
			}
		});
	}

	it("does not track ids that contain a comma", () => {
		const layers = {
			...defaultLayers(),
			"x,y": tile(true, {visibleInLayerSwitcher: true}),
		};
		const s = setup({url: "/page#layers=", layers});
		// "x,y" is not tracked, so an empty list leaves it alone
		expect(s.visible("x,y")).toBe(true);
		expect(s.visible("poi")).toBe(false);
	});
});

describe("with the feature deep-link plugin", () => {
	const original = {
		pushState: window.history.pushState,
		replaceState: window.history.replaceState,
	};
	afterEach(() => {
		// the deep-link plugin patches the global history functions
		window.history.pushState = original.pushState;
		window.history.replaceState = original.replaceState;
	});

	it("address writes neither reselect the feature nor add history entries", () => {
		const s = setup({
			url: "/page?feature=x#map=8/52/10",
			historyState: {featureId: "x"},
			pluginsAfter: [["featureDeepLink", createFeatureDeepLinkPlugin()]],
		});
		s.context.render!();
		const selections = () =>
			(s.store.getState() as {featureSelections: unknown})
				.featureSelections;
		expect(
			(selections() as {select?: {features: string[]}} | undefined)
				?.select?.features,
		).toEqual(["x"]);
		const before = selections();
		const push = vi.spyOn(window.history, "pushState");
		const length = window.history.length;

		moveView(s, 11, 48, 9);

		expect(push).not.toHaveBeenCalled();
		expect(window.history.length).toBe(length);
		expect(window.location.search).toBe("?feature=x");
		expect(selections()).toBe(before);
		expect(window.location.hash).toContain("map=9/48/11");
		expect(window.history.state).toEqual({featureId: "x"});
	});
});

describe("with the share position link plugin", () => {
	const marker = [
		"sharePosition",
		createSharePositionPlugin({enableDrawing: false}),
	] as const;
	const markerFeatures = (s: Setup) =>
		(
			s.store.getState() as {
				featureSources: Record<
					string,
					{data?: {features?: unknown[]}} | undefined
				>;
			}
		).featureSources[markedPointSourceId("sharePositionLink")]?.data
			?.features ?? [];

	for (const order of ["before", "after"] as const) {
		it(`keeps the linked view and still places the marker (plugin ${order})`, () => {
			const s = setup({
				url: "/page#lm=52/10&map=12/48/11",
				[order === "before" ? "pluginsBefore" : "pluginsAfter"]: [
					[
						"sharePosition",
						createSharePositionPlugin({enableDrawing: false}),
					],
				],
			});
			expect(markerFeatures(s)).toHaveLength(1);
			const center = toLonLat(s.view.getCenter()!);
			expect(center[0]).toBeCloseTo(11, 6);
			expect(center[1]).toBeCloseTo(48, 6);
			expect(s.view.getZoom()).toBeCloseTo(12, 6);
		});
	}

	it("still recentres on the marker without a usable view parameter", () => {
		for (const url of [
			"/page#lm=52/10",
			"/page#lm=52/10&map=garbage",
			"/page#lm=52/10&map=40/1/2",
		]) {
			const s = setup({url, pluginsAfter: [[marker[0], marker[1]]]});
			const center = toLonLat(s.view.getCenter()!);
			expect(center[0], url).toBeCloseTo(10, 6);
			expect(center[1], url).toBeCloseTo(52, 6);
			expect(s.view.getZoom(), url).toBe(16);
		}
	});

	it("recentres on the marker when the view parameter is disabled", () => {
		const s = setup({
			url: "/page#lm=52/10&map=12/48/11",
			options: {viewParameter: false},
			pluginsAfter: [[marker[0], marker[1]]],
		});
		expect(s.view.getZoom()).toBe(16);
	});
});
