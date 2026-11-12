import WMTSCapabilities from "ol/format/WMTSCapabilities";
import type TileLayer from "ol/layer/Tile";
import {get as getProjection} from "ol/proj";
import WMTS, {optionsFromCapabilities} from "ol/source/WMTS";
import type WMTSTileGrid from "ol/tilegrid/WMTS";

import {describe, expect, it} from "vitest";

import {di, updateProxyObject} from "@mapsight/core/ol-proxy";
import TileLayerDefinition from "@mapsight/core/ol-proxy/definitions/layer/TileLayer";
import WMTSSource from "@mapsight/core/ol-proxy/definitions/source/WMTSSource";

import {wmtsCapabilitiesToLayers} from "../wmts";
import {WMTS_KVP, WMTS_REST} from "./fixtures";

type Entries = ReturnType<typeof wmtsCapabilitiesToLayers>;

function byName(entries: Entries) {
	return Object.fromEntries(entries.map((entry) => [entry.name, entry]));
}

/** Creates the OpenLayers source from a helper result, through ol-proxy. */
function createSource(entry: Entries[number]): WMTS {
	di.injectDefinitions([TileLayerDefinition, WMTSSource]);

	let layer: TileLayer<WMTS> | undefined;
	updateProxyObject({
		di,
		newDefinition: entry.definition,
		adder: (created) => (layer = created as TileLayer<WMTS>),
	});
	return layer!.getSource()!;
}

function tileUrl(source: WMTS, tileCoord: [number, number, number]) {
	return source.getTileUrlFunction()(
		tileCoord,
		1,
		getProjection("EPSG:3857")!,
	);
}

describe("wmtsCapabilitiesToLayers", () => {
	it("returns plain data for every layer", () => {
		const layers = byName(wmtsCapabilitiesToLayers(WMTS_KVP));

		expect(Object.keys(layers)).toEqual(["basemap", "overview"]);
		expect(layers["basemap"]).toMatchObject({
			name: "basemap",
			title: "Base map",
			abstract: "A basemap.",
			geographicBoundingBox: [5, 47, 15, 55],
			crs: ["urn:ogc:def:crs:EPSG::4326", "urn:ogc:def:crs:EPSG::3857"],
			matrixSets: ["geographic", "webmercator"],
			styles: ["plain", "default"],
			formats: ["image/jpeg", "image/png"],
		});
		expect(layers["overview"]).toMatchObject({
			title: "Polar overview",
		});
	});

	it("creates a JSON layer definition that ol-proxy turns into a KVP source", () => {
		const entry = byName(wmtsCapabilitiesToLayers(WMTS_KVP))["basemap"]!;

		// the preferred projection (default EPSG:3857) picks the matrix set
		expect(entry.definition).toMatchObject({
			type: "TileLayer",
			options: {
				source: {
					type: "WMTSSource",
					options: {
						urls: ["https://tiles.example.org/wmts?"],
						layer: "basemap",
						style: "default",
						matrixSet: "webmercator",
						format: "image/jpeg",
						requestEncoding: "KVP",
						version: "1.0.0",
						projection: "EPSG:3857",
					},
				},
			},
		});
		// it lives in Redux state: plain JSON only
		expect(JSON.parse(JSON.stringify(entry.definition))).toEqual(
			entry.definition,
		);

		const source = createSource(entry);
		expect(source).toBeInstanceOf(WMTS);
		expect(tileUrl(source, [1, 1, 0])).toBe(
			"https://tiles.example.org/wmts?layer=basemap&style=default&tilematrixset=webmercator" +
				"&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg" +
				"&TileMatrix=1&TileCol=1&TileRow=0",
		);
	});

	it("creates a REST source with the default dimension values", () => {
		const entry = byName(wmtsCapabilitiesToLayers(WMTS_REST))["aerial"]!;

		const source = createSource(entry);
		expect(source.getRequestEncoding()).toBe("REST");
		expect(tileUrl(source, [2, 3, 1])).toBe(
			"https://tiles.example.org/rest/aerial/2020/webmercator/2/3/1.jpg",
		);
	});

	it("describes the tile grid exactly as OpenLayers derives it", () => {
		const entry = byName(wmtsCapabilitiesToLayers(WMTS_KVP))["basemap"]!;
		const expected = optionsFromCapabilities(
			new WMTSCapabilities().read(WMTS_KVP) as Record<string, unknown>,
			{layer: "basemap", projection: "EPSG:3857"},
		)!.tileGrid;
		const actual = createSource(entry).getTileGrid() as WMTSTileGrid;

		expect(actual.getResolutions()).toEqual(expected.getResolutions());
		expect(actual.getMatrixIds()).toEqual(["0", "1", "2"]);
		for (const z of [0, 1, 2]) {
			expect(actual.getOrigin(z)).toEqual(expected.getOrigin(z));
			expect(actual.getTileSize(z)).toEqual(expected.getTileSize(z));
			expect(actual.getFullTileRange(z)).toEqual(
				expected.getFullTileRange(z),
			);
		}
	});

	it("keeps tile matrix limits", () => {
		const entry = byName(wmtsCapabilitiesToLayers(WMTS_KVP))["overview"]!;
		const grid = createSource(entry).getTileGrid() as WMTSTileGrid;

		// "overview" is only published in the geographic matrix set
		expect(entry.definition).toMatchObject({
			options: {source: {options: {projection: "EPSG:4326"}}},
		});
		expect(grid.getMatrixIds()).toEqual(["geographic:0", "geographic:1"]);
		expect(grid.getFullTileRange(1)).toMatchObject({
			minX: 2,
			maxX: 3,
			minY: 0,
			maxY: 1,
		});
	});

	it("selects the matrix set by identifier or by preferred projection", () => {
		const byMatrixSet = byName(
			wmtsCapabilitiesToLayers(WMTS_KVP, {matrixSet: "geographic"}),
		);
		const byProjection = byName(
			wmtsCapabilitiesToLayers(WMTS_KVP, {projection: "EPSG:4326"}),
		);

		for (const layers of [byMatrixSet, byProjection]) {
			const source = createSource(layers["basemap"]!);
			expect(source.getMatrixSet()).toBe("geographic");
			expect(source.getProjection()?.getCode()).toBe("EPSG:4326");
			// the grid's lat/long axis order has been resolved to x/y
			expect(source.getTileGrid()!.getOrigin(0)).toEqual([-180, 90]);
			expect(tileUrl(source, [1, 3, 1])).toContain(
				"TileMatrix=geographic%3A1&TileCol=3&TileRow=1",
			);
		}
	});

	it("leaves out layers that cannot serve the requested matrix set or style", () => {
		// "overview" is not published in "webmercator"
		expect(
			wmtsCapabilitiesToLayers(WMTS_KVP, {matrixSet: "webmercator"}).map(
				(entry) => entry.name,
			),
		).toEqual(["basemap"]);
		expect(
			wmtsCapabilitiesToLayers(WMTS_KVP, {matrixSet: "unknown"}),
		).toEqual([]);

		expect(
			wmtsCapabilitiesToLayers(WMTS_KVP, {style: "plain"}).map(
				(entry) => entry.name,
			),
		).toEqual(["basemap"]);
		const plain = byName(
			wmtsCapabilitiesToLayers(WMTS_KVP, {style: "plain"}),
		)["basemap"]!;
		expect(tileUrl(createSource(plain), [0, 0, 0])).toContain(
			"style=plain",
		);
	});

	it("does not modify a parsed capabilities object", () => {
		const parsed = new WMTSCapabilities().read(WMTS_KVP) as Record<
			string,
			unknown
		>;
		const copy = structuredClone(parsed);

		const entries = wmtsCapabilitiesToLayers(parsed);

		expect(entries).toHaveLength(2);
		expect(parsed).toEqual(copy);
	});

	it("keeps text from the document out of the layer definitions", () => {
		const hostile = "&lt;img src=x onerror=alert(1)&gt;";
		const xml = WMTS_KVP.replace(
			"<ows:Title>Base map</ows:Title>",
			`<ows:Title>${hostile}</ows:Title>`,
		).replace(
			"<ows:Abstract>A basemap.</ows:Abstract>",
			`<ows:Abstract>${hostile}</ows:Abstract>`,
		);

		const entry = byName(wmtsCapabilitiesToLayers(xml))["basemap"]!;

		expect(entry.title).toBe("<img src=x onerror=alert(1)>");
		expect(JSON.stringify(entry.definition)).not.toContain("img");
		expect(entry.definition).not.toHaveProperty("metaData");
	});

	it("ignores tile URLs that are not http(s)", () => {
		const xml = WMTS_REST.replace(
			"https://tiles.example.org/rest",
			"javascript:alert(1)//",
		);

		expect(wmtsCapabilitiesToLayers(xml)).toEqual([]);
	});

	it("rejects documents it cannot use", () => {
		expect(() => wmtsCapabilitiesToLayers("<html><body/></html>")).toThrow(
			"Not a WMTS",
		);
		expect(() => wmtsCapabilitiesToLayers("<Capabilities>")).toThrow(
			"well-formed",
		);
	});
});

/** Applies `change` to the `webmercator` tile matrix set of a document only. */
function changeWebMercator(xml: string, change: (matrixSet: string) => string) {
	const start = xml.indexOf("<ows:Identifier>webmercator</ows:Identifier>");
	const end = xml.indexOf("</TileMatrixSet>", start);
	return xml.slice(0, start) + change(xml.slice(start, end)) + xml.slice(end);
}

describe("wmtsCapabilitiesToLayers with malformed numeric fields", () => {
	// Only the webmercator matrix set is changed: "basemap" is published in both
	// matrix sets and prefers webmercator, "overview" only uses geographic.
	const malformations: Array<[string, (matrixSet: string) => string]> = [
		[
			"a missing ScaleDenominator",
			(set) =>
				set.replace(/<ScaleDenominator>[^<]*<\/ScaleDenominator>/, ""),
		],
		[
			"a non-numeric ScaleDenominator",
			(set) =>
				set.replace(
					/<ScaleDenominator>[^<]*</,
					"<ScaleDenominator>abc<",
				),
		],
		[
			"a ScaleDenominator of zero",
			(set) =>
				set.replace(/<ScaleDenominator>[^<]*</, "<ScaleDenominator>0<"),
		],
		[
			"a missing TopLeftCorner",
			(set) => set.replace(/<TopLeftCorner>[^<]*<\/TopLeftCorner>/, ""),
		],
		[
			"a non-numeric TopLeftCorner",
			(set) =>
				set.replace(
					/<TopLeftCorner>[^<]*</,
					"<TopLeftCorner>left top<",
				),
		],
		[
			"a missing TileWidth",
			(set) => set.replace(/<TileWidth>[^<]*<\/TileWidth>/, ""),
		],
		[
			"a non-numeric TileHeight",
			(set) => set.replace(/<TileHeight>[^<]*</, "<TileHeight>high<"),
		],
		[
			"a missing MatrixWidth",
			(set) => set.replace(/<MatrixWidth>[^<]*<\/MatrixWidth>/, ""),
		],
		[
			"a non-numeric MatrixHeight",
			(set) => set.replace(/<MatrixHeight>[^<]*</, "<MatrixHeight>many<"),
		],
		[
			"a missing tile matrix Identifier",
			(set) => set.replace(/<ows:Identifier>0<\/ows:Identifier>/, ""),
		],
		[
			"two tile matrices with the same ScaleDenominator",
			(set) => set.replace(/139770566.00717944/, "279541132.0143589"),
		],
	];

	it.each(malformations)("skips the layer for %s", (_label, change) => {
		const xml = changeWebMercator(WMTS_KVP, change);

		const entries = wmtsCapabilitiesToLayers(xml);

		// the layer that only uses the intact matrix set is still returned
		expect(entries.map((entry) => entry.name)).toEqual(["overview"]);
		for (const entry of entries) {
			expect(JSON.parse(JSON.stringify(entry))).toEqual(entry);
		}
	});

	it("skips only layers that use the broken matrix set", () => {
		const xml = changeWebMercator(WMTS_REST, (set) =>
			set.replace(/<ScaleDenominator>[^<]*<\/ScaleDenominator>/, ""),
		);

		expect(wmtsCapabilitiesToLayers(xml)).toEqual([]);
	});

	it("never emits non-finite numbers in a tile grid", () => {
		for (const [, change] of malformations) {
			const entries = wmtsCapabilitiesToLayers(
				changeWebMercator(WMTS_KVP, change),
			);
			expect(JSON.stringify(entries)).not.toMatch(/null|NaN|Infinity/);
		}
	});
});

describe("wmtsCapabilitiesToLayers identifiers", () => {
	it("keeps identifiers that differ only in case", () => {
		const xml = WMTS_KVP.replace(
			"<Style><ows:Identifier>plain</ows:Identifier></Style>",
			"<Style><ows:Identifier>Default</ows:Identifier></Style>",
		).replace(
			"<Format>image/jpeg</Format>",
			"<Format>image/JPEG</Format><Format>image/jpeg</Format>",
		);

		const entry = byName(wmtsCapabilitiesToLayers(xml))["basemap"]!;

		expect(entry.styles).toEqual(["Default", "default"]);
		expect(entry.formats).toEqual([
			"image/JPEG",
			"image/jpeg",
			"image/png",
		]);
	});

	it("finds a style that only differs in case from another one", () => {
		const xml = WMTS_KVP.replace(
			"<Style><ows:Identifier>plain</ows:Identifier></Style>",
			"<Style><ows:Identifier>Default</ows:Identifier></Style>",
		);

		for (const style of ["default", "Default"]) {
			const entry = byName(wmtsCapabilitiesToLayers(xml, {style}))[
				"basemap"
			];
			expect(entry).toBeDefined();
			expect(tileUrl(createSource(entry!), [0, 0, 0])).toContain(
				`style=${style}`,
			);
		}
	});

	it("keeps matrix set identifiers that differ only in case", () => {
		const xml = WMTS_KVP.replace(
			"<TileMatrixSetLink><TileMatrixSet>geographic</TileMatrixSet></TileMatrixSetLink>\n\t\t\t<TileMatrixSetLink><TileMatrixSet>webmercator</TileMatrixSet></TileMatrixSetLink>",
			"<TileMatrixSetLink><TileMatrixSet>webmercator</TileMatrixSet></TileMatrixSetLink>" +
				"<TileMatrixSetLink><TileMatrixSet>WebMercator</TileMatrixSet></TileMatrixSetLink>",
		);

		const entry = byName(wmtsCapabilitiesToLayers(xml))["basemap"]!;

		expect(entry.matrixSets).toEqual(["webmercator", "WebMercator"]);
	});

	it("treats CRS codes that differ only in case as one", () => {
		const xml = WMTS_KVP.replace(
			"urn:ogc:def:crs:EPSG::4326",
			"URN:OGC:DEF:CRS:EPSG::3857",
		);

		const entry = byName(wmtsCapabilitiesToLayers(xml))["basemap"]!;

		expect(entry.crs).toEqual(["URN:OGC:DEF:CRS:EPSG::3857"]);
	});
});
