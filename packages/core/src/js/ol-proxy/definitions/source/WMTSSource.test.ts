import {get as getProjection} from "ol/proj";
import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";

import {afterEach, describe, expect, it, vi} from "vitest";

import type {OptionValue, Options} from "@/lib/map/types";
import {updateProxyObject} from "@/ol-proxy";
import DependencyManager from "@/ol-proxy/DependencyManager";

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

	it("logs an error and leaves the tile grid unset for an invalid description", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});

		const source = createSource({
			url: "https://tiles.example.org/wmts",
			layer: "basemap",
			style: "default",
			matrixSet: "webmercator",
			// matrixIds missing
			tileGrid: {origin: [0, 0], resolutions: [1, 2], tileSize: 256},
		});

		expect(error).toHaveBeenCalled();
		expect(source!.getTileGrid()).toBeNull();
	});
});
