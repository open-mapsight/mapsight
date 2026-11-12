import TileLayer from "ol/layer/Tile";
import {get as getProjection} from "ol/proj";
import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";

import {afterEach, describe, expect, it, vi} from "vitest";

import type {OptionValue, Options} from "@/lib/map/types";
import {updateProxyObject} from "@/ol-proxy";
import DependencyManager from "@/ol-proxy/DependencyManager";
import TileLayerDefinition from "@/ol-proxy/definitions/layer/TileLayer";

import type {WMTSTileGridDescription} from "./WMTSSource";
import WMTSSource from "./WMTSSource";

const WEB_MERCATOR_EDGE = 20037508.342789244;

/** Three zoom levels of the usual Web Mercator pyramid, JSON only. */
const tileGrid = {
	origin: [-WEB_MERCATOR_EDGE, WEB_MERCATOR_EDGE],
	resolutions: [156543.03392804097, 78271.51696402048, 39135.75848201024],
	matrixIds: ["L00", "L01", "L02"],
	tileSize: 256,
} satisfies WMTSTileGridDescription;

function createSource(options: Options): WMTS | undefined {
	const di = new DependencyManager();
	di.injectDefinitions([WMTSSource]);

	let source: WMTS | undefined;
	updateProxyObject<WMTS>({
		di,
		newDefinition: {type: "WMTSSource", options},
		adder: (created) => (source = created),
	});
	return source;
}

/** Freezes a value and everything reachable from it, like frozen Redux state. */
function deepFreeze<T>(value: T): T {
	if (typeof value === "object" && value !== null) {
		Object.values(value).forEach(deepFreeze);
		Object.freeze(value);
	}
	return value;
}

/**
 * Applies successive configs the way the layer machinery does: the previous
 * definition and the current object are handed back in on every update.
 */
function createLifecycle() {
	const di = new DependencyManager();
	di.injectDefinitions([WMTSSource]);

	let source: WMTS | undefined;
	let definition: {type: string; options: Options} | undefined;

	return {
		get source() {
			return source;
		},
		apply(options: Options) {
			const next = {type: "WMTSSource", options};
			updateProxyObject<WMTS>({
				di,
				oldObject: source,
				oldDefinition: definition,
				newDefinition: next,
				adder: (created) => (source = created),
			});
			definition = next;
			return source;
		},
	};
}

const baseOptions = {
	url: "https://tiles.example.org/wmts",
	layer: "basemap",
	style: "default",
	matrixSet: "webmercator",
	tileGrid,
} satisfies Options;

function tileUrl(source: WMTS, tileCoord: [number, number, number]) {
	return source.getTileUrlFunction()(
		tileCoord,
		1,
		getProjection("EPSG:3857")!,
	);
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("WMTSSource definition", () => {
	it("creates a KVP source from a JSON description", () => {
		const source = createSource({
			url: "https://tiles.example.org/wmts",
			layer: "basemap",
			style: "default",
			matrixSet: "webmercator",
			format: "image/png",
			projection: "EPSG:3857",
			tileGrid,
		});

		expect(source).toBeInstanceOf(WMTS);
		expect(source!.getTileGrid()).toBeInstanceOf(WMTSTileGrid);
		expect(source!.getRequestEncoding()).toBe("KVP");
		expect(tileUrl(source!, [1, 1, 0])).toBe(
			"https://tiles.example.org/wmts?layer=basemap&style=default&tilematrixset=webmercator" +
				"&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng" +
				"&TileMatrix=L01&TileCol=1&TileRow=0",
		);
	});

	it("creates a REST source from a JSON description", () => {
		const source = createSource({
			url: "https://tiles.example.org/wmts/{layer}/{style}/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png",
			requestEncoding: "REST",
			layer: "basemap",
			style: "default",
			matrixSet: "webmercator",
			projection: "EPSG:3857",
			tileGrid,
		});

		expect(source!.getRequestEncoding()).toBe("REST");
		expect(tileUrl(source!, [2, 3, 1])).toBe(
			"https://tiles.example.org/wmts/basemap/default/webmercator/L02/3/1.png",
		);
	});

	it("derives tile coordinates from the described origin", () => {
		const source = createSource({
			url: "https://tiles.example.org/wmts",
			layer: "basemap",
			style: "default",
			matrixSet: "webmercator",
			tileGrid,
		});

		// north-east quadrant at zoom 1 is column 1, row 0 (rows count downwards)
		expect(
			source!.getTileGrid()!.getTileCoordForCoordAndZ([1e7, 1e7], 1),
		).toEqual([1, 1, 0]);
	});

	it("supports per-matrix origins, tile sizes and matrix sizes", () => {
		const source = createSource({
			url: "https://tiles.example.org/wmts",
			layer: "basemap",
			style: "default",
			matrixSet: "custom",
			tileGrid: {
				origins: [
					[0, 1000],
					[0, 1000],
				],
				resolutions: [4, 2],
				matrixIds: ["0", "1"],
				tileSizes: [256, [128, 128]],
				sizes: [
					[1, 1],
					[8, 8],
				],
			} satisfies WMTSTileGridDescription,
		});

		const grid = source!.getTileGrid()!;
		expect(grid.getTileSize(1)).toEqual([128, 128]);
		expect(grid.getFullTileRange(1)).toMatchObject({
			minX: 0,
			maxX: 7,
			minY: 0,
			maxY: 7,
		});
	});

	it("limits the tile range per matrix", () => {
		const source = createSource({
			url: "https://tiles.example.org/wmts",
			layer: "basemap",
			style: "default",
			matrixSet: "webmercator",
			tileGrid: {
				...tileGrid,
				tileRanges: [
					[0, 0, 0, 0],
					[1, 1, 0, 0],
					[2, 3, 0, 1],
				],
			} satisfies WMTSTileGridDescription,
		});

		expect(source!.getTileGrid()!.getFullTileRange(2)).toMatchObject({
			minX: 2,
			maxX: 3,
			minY: 0,
			maxY: 1,
		});
	});

	it("keeps accepting a tile grid instance", () => {
		const instance = new WMTSTileGrid(tileGrid);
		const source = createSource({
			url: "https://tiles.example.org/wmts",
			layer: "basemap",
			style: "default",
			matrixSet: "webmercator",
			// not JSON, but programmatic callers pass instances
			tileGrid: instance as unknown as OptionValue,
		});

		expect(source!.getTileGrid()).toBe(instance);
		expect(tileUrl(source!, [0, 0, 0])).toContain("layer=basemap");
	});

	it("passes dimensions on to tile requests", () => {
		const source = createSource({
			url: "https://tiles.example.org/wmts",
			layer: "basemap",
			style: "default",
			matrixSet: "webmercator",
			tileGrid,
			dimensions: {time: "2020-01-01"},
		});

		expect(tileUrl(source!, [0, 0, 0])).toContain("time=2020-01-01");
	});

	it("does not share the dimensions object with the config", () => {
		const options = deepFreeze({
			...baseOptions,
			dimensions: {time: "2020-01-01"},
		});

		const source = createSource(options);

		expect(source!.getDimensions()).toEqual({time: "2020-01-01"});
		expect(source!.getDimensions()).not.toBe(options.dimensions);
	});
});

describe("WMTSSource dimensions lifecycle", () => {
	it("creates a source from deeply frozen config", () => {
		const lifecycle = createLifecycle();

		const source = lifecycle.apply(
			deepFreeze({...baseOptions, dimensions: {time: "2020-01-01"}}),
		);

		expect(tileUrl(source!, [0, 0, 0])).toContain("time=2020-01-01");
	});

	it("applies a changed value without mutating the previous config", () => {
		const lifecycle = createLifecycle();
		const first = deepFreeze({
			...baseOptions,
			dimensions: {time: "2020-01-01"},
		});
		const second = deepFreeze({
			...baseOptions,
			dimensions: {time: "2021-06-01"},
		});

		lifecycle.apply(first);
		const source = lifecycle.apply(second);

		expect(tileUrl(source!, [0, 0, 0])).toContain("time=2021-06-01");
		expect(tileUrl(source!, [0, 0, 0])).not.toContain("2020-01-01");
		expect(first.dimensions).toEqual({time: "2020-01-01"});
		expect(second.dimensions).toEqual({time: "2021-06-01"});
	});

	it("applies an added dimension", () => {
		const lifecycle = createLifecycle();
		lifecycle.apply(
			deepFreeze({...baseOptions, dimensions: {time: "2020-01-01"}}),
		);

		const source = lifecycle.apply(
			deepFreeze({
				...baseOptions,
				dimensions: {time: "2020-01-01", elevation: "10"},
			}),
		);

		const url = tileUrl(source!, [0, 0, 0]);
		expect(url).toContain("time=2020-01-01");
		expect(url).toContain("elevation=10");
	});

	it("drops a removed dimension from tile requests", () => {
		const lifecycle = createLifecycle();
		lifecycle.apply(
			deepFreeze({
				...baseOptions,
				dimensions: {time: "2020-01-01", elevation: "10"},
			}),
		);

		const source = lifecycle.apply(
			deepFreeze({...baseOptions, dimensions: {time: "2020-01-01"}}),
		);

		const url = tileUrl(source!, [0, 0, 0]);
		expect(url).toContain("time=2020-01-01");
		expect(url).not.toContain("elevation");
		expect(source!.getKey()).not.toContain("elevation");
	});

	it("drops all dimensions when the option is removed", () => {
		const lifecycle = createLifecycle();
		lifecycle.apply(
			deepFreeze({...baseOptions, dimensions: {time: "2020-01-01"}}),
		);

		const source = lifecycle.apply(deepFreeze({...baseOptions}));

		expect(tileUrl(source!, [0, 0, 0])).not.toContain("time=");
		expect(source!.getDimensions()).toEqual({});
	});
});

describe("WMTSSource tile grid validation", () => {
	function expectRejected(tileGridValue: unknown, message: RegExp) {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});

		const source = createSource({
			...baseOptions,
			tileGrid: tileGridValue as OptionValue,
		});

		expect(source).toBeUndefined();
		expect(error).toHaveBeenCalledTimes(1);
		const reason = error.mock.calls[0]!.find(
			(argument): argument is Error => argument instanceof Error,
		);
		expect(reason?.message).toMatch(message);
	}

	it("rejects a description without matrixIds", () => {
		expectRejected(
			{origin: [0, 0], resolutions: [4, 2], tileSize: 256},
			/matrixIds/,
		);
	});

	it("rejects a description without resolutions", () => {
		expectRejected(
			{origin: [0, 0], matrixIds: ["0", "1"], tileSize: 256},
			/resolutions/,
		);
	});

	it("rejects empty resolutions", () => {
		expectRejected(
			{origin: [0, 0], resolutions: [], matrixIds: [], tileSize: 256},
			/resolutions/,
		);
	});

	it("rejects matrixIds and resolutions of different length", () => {
		expectRejected(
			{origin: [0, 0], resolutions: [4, 2, 1], matrixIds: ["0", "1"]},
			/matrixIds.*resolutions|resolutions.*matrixIds/,
		);
	});

	it.each([
		["origins", {origins: [[0, 0]]}],
		["tileSizes", {origin: [0, 0], tileSizes: [256]}],
		["sizes", {origin: [0, 0], sizes: [[1, 1]]}],
		["tileRanges", {origin: [0, 0], tileRanges: [[0, 0, 0, 0]]}],
	])("rejects %s of a different length", (name, extra) => {
		expectRejected(
			{resolutions: [4, 2], matrixIds: ["0", "1"], ...extra},
			new RegExp(name),
		);
	});

	it.each([
		["a string", ["4", 2]],
		["null", [null, 2]],
		["Infinity", [Infinity, 2]],
		["NaN", [NaN, 2]],
		["zero", [4, 0]],
		["a negative number", [4, -2]],
	])("rejects a resolution that is %s", (_label, resolutions) => {
		expectRejected(
			{origin: [0, 0], resolutions, matrixIds: ["0", "1"]},
			/resolutions/,
		);
	});

	it("rejects ascending resolutions", () => {
		expectRejected(
			{origin: [0, 0], resolutions: [2, 4], matrixIds: ["0", "1"]},
			/descending/,
		);
	});

	it("rejects equal resolutions", () => {
		expectRejected(
			{origin: [0, 0], resolutions: [2, 2], matrixIds: ["0", "1"]},
			/descending/,
		);
	});

	it.each([
		["a number", 1],
		["an empty string", ""],
		["null", null],
	])("rejects a matrix id that is %s", (_label, id) => {
		expectRejected(
			{origin: [0, 0], resolutions: [4, 2], matrixIds: ["0", id]},
			/matrixIds/,
		);
	});

	it("rejects a description without origin, origins or extent", () => {
		expectRejected({resolutions: [4, 2], matrixIds: ["0", "1"]}, /origin/);
	});

	it("rejects origin and origins given together", () => {
		expectRejected(
			{
				origin: [0, 0],
				origins: [
					[0, 0],
					[0, 0],
				],
				resolutions: [4, 2],
				matrixIds: ["0", "1"],
			},
			/origin/,
		);
	});

	it.each([
		["with a string", [0, "1"]],
		["with NaN", [0, NaN]],
		["of the wrong length", [0]],
	])("rejects an origin %s", (_label, origin) => {
		expectRejected(
			{origin, resolutions: [4, 2], matrixIds: ["0", "1"]},
			/origin/,
		);
	});

	it("rejects tileSize and tileSizes given together", () => {
		expectRejected(
			{
				origin: [0, 0],
				resolutions: [4, 2],
				matrixIds: ["0", "1"],
				tileSize: 256,
				tileSizes: [256, 256],
			},
			/tileSize/,
		);
	});

	it.each([
		["zero", 0],
		["a string", "256"],
		["a pair with NaN", [256, NaN]],
	])("rejects a tile size that is %s", (_label, tileSize) => {
		expectRejected(
			{
				origin: [0, 0],
				resolutions: [4, 2],
				matrixIds: ["0", "1"],
				tileSize,
			},
			/tileSize/,
		);
	});

	it.each([
		["with a missing value", [0, 0, 10]],
		["with a non-finite value", [0, 0, 10, Infinity]],
		["with a string", [0, 0, "10", 10]],
	])("rejects an extent %s", (_label, extent) => {
		expectRejected(
			{extent, resolutions: [4, 2], matrixIds: ["0", "1"]},
			/extent/,
		);
	});

	it.each([
		[
			"sizes",
			{
				sizes: [
					[1, 1],
					[2, "2"],
				],
			},
		],
		[
			"tileRanges",
			{
				tileRanges: [
					[0, 0, 0, 0],
					[0, 1, 0, NaN],
				],
			},
		],
	])("rejects non-numeric %s", (name, extra) => {
		expectRejected(
			{
				origin: [0, 0],
				resolutions: [4, 2],
				matrixIds: ["0", "1"],
				...extra,
			},
			new RegExp(name),
		);
	});

	it("rejects a missing tile grid", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});

		const options: Options = {...baseOptions};
		delete options.tileGrid;
		const source = createSource(options);

		expect(source).toBeUndefined();
		expect(error).toHaveBeenCalledTimes(1);
	});

	it("rejects a tile grid that is neither a description nor an instance", () => {
		expectRejected("grid", /tileGrid/);
	});

	it("does not hand a partly built source to the adder", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const adder = vi.fn();
		const di = new DependencyManager();
		di.injectDefinitions([WMTSSource]);

		updateProxyObject<WMTS>({
			di,
			newDefinition: {
				type: "WMTSSource",
				options: {
					...baseOptions,
					tileGrid: {resolutions: [1, 2]} as unknown as OptionValue,
				},
			},
			adder,
		});

		expect(adder).not.toHaveBeenCalled();
	});

	it("leaves a layer without a source when its source is rejected", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		const di = new DependencyManager();
		di.injectDefinitions([TileLayerDefinition, WMTSSource]);

		let layer: TileLayer | undefined;
		updateProxyObject<TileLayer>({
			di,
			newDefinition: {
				type: "TileLayer",
				options: {
					source: {
						type: "WMTSSource",
						options: {
							...baseOptions,
							tileGrid: {resolutions: [2, 1]} as OptionValue,
						},
					},
				},
			},
			adder: (created) => (layer = created),
		});

		expect(layer).toBeInstanceOf(TileLayer);
		expect(layer!.getSource()).toBeNull();
		expect(error).toHaveBeenCalledTimes(1);
	});

	it("does not use the description arrays by reference", () => {
		const description = {
			origin: [0, 1000],
			resolutions: [4, 2],
			matrixIds: ["0", "1"],
		};

		const source = createSource({...baseOptions, tileGrid: description});
		description.resolutions[0] = 99;
		description.matrixIds[0] = "changed";

		expect(source!.getTileGrid()!.getResolutions()).toEqual([4, 2]);
		expect((source!.getTileGrid() as WMTSTileGrid).getMatrixIds()).toEqual([
			"0",
			"1",
		]);
	});

	it("accepts an extent instead of an origin", () => {
		const source = createSource({
			...baseOptions,
			tileGrid: {
				extent: [0, 0, 1000, 1000],
				resolutions: [4, 2],
				matrixIds: ["0", "1"],
			},
		});

		expect(source!.getTileGrid()!.getOrigin(0)).toEqual([0, 1000]);
	});

	it("uses tileRanges directly without intersecting them with the extent", () => {
		const source = createSource({
			...baseOptions,
			tileGrid: {
				extent: [0, 0, 512, 512],
				origin: [0, 1024],
				resolutions: [2],
				matrixIds: ["0"],
				tileRanges: [[0, 20, 0, 20]],
			},
		});

		expect(source!.getTileGrid()!.getFullTileRange(0)).toMatchObject({
			minX: 0,
			maxX: 20,
			minY: 0,
			maxY: 20,
		});
	});
});
