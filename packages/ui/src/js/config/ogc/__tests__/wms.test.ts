import type TileLayer from "ol/layer/Tile";
import TileWMS from "ol/source/TileWMS";

import {describe, expect, it} from "vitest";

import {di, updateProxyObject} from "@mapsight/core/ol-proxy";
import TileLayerDefinition from "@mapsight/core/ol-proxy/definitions/layer/TileLayer";
import TileWMSSource from "@mapsight/core/ol-proxy/definitions/source/TileWMSSource";

import {wmsCapabilitiesToLayers} from "../wms";
import {WMS_111, WMS_130} from "./fixtures";

function byName(entries: ReturnType<typeof wmsCapabilitiesToLayers>) {
	return Object.fromEntries(entries.map((entry) => [entry.name, entry]));
}

describe("wmsCapabilitiesToLayers (WMS 1.3.0)", () => {
	it("returns one entry per named layer, flattened in document order", () => {
		const entries = wmsCapabilitiesToLayers(WMS_130);

		expect(entries.map((entry) => entry.name)).toEqual([
			"boundaries",
			"districts",
			"parcels",
			"rivers",
		]);
		expect(byName(entries)["rivers"]).toMatchObject({
			title: "Rivers",
			abstract: "Rivers and streams.",
		});
	});

	it("resolves inherited values as the specification describes", () => {
		const layers = byName(wmsCapabilitiesToLayers(WMS_130));

		// CRS and styles are added to the parents' ones
		expect(layers["districts"]?.crs).toEqual([
			"EPSG:25832",
			"EPSG:3857",
			"EPSG:4326",
		]);
		expect(layers["districts"]?.styles).toEqual([
			"labelled",
			"outline",
			"filled",
		]);
		expect(layers["parcels"]?.crs).toEqual([
			"EPSG:2056",
			"EPSG:25832",
			"EPSG:3857",
			"EPSG:4326",
		]);

		// the geographic bounding box is replaced by a child's own one, otherwise
		// inherited, also over more than one level
		expect(layers["boundaries"]?.geographicBoundingBox).toEqual([
			6,
			47 + 3,
			10,
			52,
		]);
		expect(layers["districts"]?.geographicBoundingBox).toEqual([
			6, 50, 10, 52,
		]);
		expect(layers["rivers"]?.geographicBoundingBox).toEqual([
			5, 47, 15, 55,
		]);

		// attribution of the root applies to every descendant
		expect(layers["districts"]?.attribution).toBe("Example Org");
		expect(layers["rivers"]?.attribution).toBe("Example Org");

		// queryable is inherited (here from the root), unless overridden
		expect(layers["boundaries"]?.queryable).toBe(true);
		expect(layers["districts"]?.queryable).toBe(true);
		expect(layers["rivers"]?.queryable).toBe(true);
		expect(layers["parcels"]?.queryable).toBe(false);
	});

	it("creates a TileWMS layer definition from the advertised GetMap URL", () => {
		const entry = byName(wmsCapabilitiesToLayers(WMS_130))["districts"]!;

		expect(entry.definition).toEqual({
			type: "TileLayer",
			options: {
				source: {
					type: "TileWMSSource",
					options: {
						url: "https://wms.example.org/maps?",
						params: {
							LAYERS: "districts",
							VERSION: "1.3.0",
							FORMAT: "image/png",
							TRANSPARENT: true,
						},
					},
				},
			},
		});
		// it lives in Redux state: plain JSON only
		expect(JSON.parse(JSON.stringify(entry))).toEqual(entry);
	});

	it("can be turned into OpenLayers objects by ol-proxy", () => {
		// the layer definition resolves its source through the shared registry
		di.injectDefinitions([TileLayerDefinition, TileWMSSource]);

		const entry = byName(wmsCapabilitiesToLayers(WMS_130))["rivers"]!;
		let layer: TileLayer<TileWMS> | undefined;
		updateProxyObject({
			di,
			newDefinition: entry.definition,
			adder: (created) => (layer = created as TileLayer<TileWMS>),
		});

		const source = layer!.getSource()!;
		expect(source).toBeInstanceOf(TileWMS);
		expect(source.getUrls()).toEqual(["https://wms.example.org/maps?"]);
		expect(source.getParams()).toMatchObject({
			LAYERS: "rivers",
			VERSION: "1.3.0",
			FORMAT: "image/png",
		});
	});

	it("prefers PNG, then other formats that support transparency", () => {
		const parsed = (formats: string[]) => ({
			version: "1.3.0",
			Capability: {
				Request: {
					GetMap: {
						Format: formats,
						DCPType: [
							{
								HTTP: {
									Get: {
										OnlineResource:
											"https://wms.example.org/maps?",
									},
								},
							},
						],
					},
				},
				Layer: {Name: "a", Title: "A"},
			},
		});
		const formatOf = (formats: string[], format?: string) =>
			(
				wmsCapabilitiesToLayers(parsed(formats), {format})[0]
					?.definition as {
					options: {source: {options: {params: {FORMAT: string}}}};
				}
			).options.source.options.params.FORMAT;

		expect(
			formatOf(["image/jpeg", "image/png; mode=8bit", "image/png"]),
		).toBe("image/png");
		expect(formatOf(["image/jpeg", "image/png; mode=8bit"])).toBe(
			"image/png; mode=8bit",
		);
		expect(formatOf(["image/jpeg", "image/gif"])).toBe("image/gif");
		expect(formatOf(["image/jpeg"])).toBe("image/jpeg");
		expect(formatOf([])).toBe("image/png");
		// an explicit choice wins
		expect(formatOf(["image/jpeg", "image/png"], "image/jpeg")).toBe(
			"image/jpeg",
		);
	});

	it("uses the url and projection options", () => {
		const entries = wmsCapabilitiesToLayers(WMS_130, {
			url: "https://proxy.example.org/wms",
			projection: "EPSG:25832",
		});

		// only layers that advertise the projection remain
		expect(entries.map((entry) => entry.name)).toEqual([
			"boundaries",
			"districts",
			"parcels",
		]);
		expect(entries[0]?.definition).toMatchObject({
			options: {
				source: {
					options: {
						url: "https://proxy.example.org/wms",
						projection: "EPSG:25832",
					},
				},
			},
		});
	});

	it("accepts the already parsed capabilities", async () => {
		const {default: WMSCapabilities} =
			await import("ol/format/WMSCapabilities");
		const parsed = new WMSCapabilities().read(WMS_130) as Record<
			string,
			unknown
		>;

		const fromString = wmsCapabilitiesToLayers(WMS_130);
		const fromObject = wmsCapabilitiesToLayers(parsed);

		expect(fromObject.map((entry) => entry.definition)).toEqual(
			fromString.map((entry) => entry.definition),
		);
		expect(fromObject.map((entry) => entry.crs)).toEqual(
			fromString.map((entry) => entry.crs),
		);
	});

	it("keeps text from the document out of the layer definitions", () => {
		const hostile = "<img src=x onerror=alert(1)>";
		const xml = WMS_130.replace(
			"<Title>Districts</Title>",
			`<Title>${hostile.replace(/</g, "&lt;")}</Title>`,
		).replace(
			"<Title>Example Org</Title>",
			`<Title>${hostile.replace(/</g, "&lt;")}</Title>`,
		);

		const entry = byName(wmsCapabilitiesToLayers(xml))["districts"]!;

		// only available as plain data...
		expect(entry.title).toBe(hostile);
		expect(entry.attribution).toBe(hostile);
		// ...and not part of what Mapsight renders from the layer config
		expect(JSON.stringify(entry.definition)).not.toContain("img");
		expect(entry.definition).not.toHaveProperty("metaData");
	});

	it("rejects documents it cannot use", () => {
		expect(() => wmsCapabilitiesToLayers("<html><body/></html>")).toThrow(
			"Not a WMS",
		);
		expect(() => wmsCapabilitiesToLayers("<WMS_Capabilities>")).toThrow(
			"well-formed",
		);

		const withoutUrl = WMS_130.replace(
			"https://wms.example.org/maps?",
			"javascript:alert(1)",
		);
		expect(() => wmsCapabilitiesToLayers(withoutUrl)).toThrow("GetMap URL");
		expect(
			wmsCapabilitiesToLayers(withoutUrl, {
				url: "https://wms.example.org/maps?",
			}),
		).toHaveLength(4);
	});
});

describe("wmsCapabilitiesToLayers (WMS 1.1.1)", () => {
	it("reads the 1.1.1 vocabulary", () => {
		const layers = byName(wmsCapabilitiesToLayers(WMS_111));

		expect(Object.keys(layers)).toEqual(["lakes", "forests"]);
		// several codes in one SRS element, plus inheritance
		expect(layers["lakes"]?.crs).toEqual(["EPSG:4326", "EPSG:3857"]);
		expect(layers["forests"]?.crs).toEqual([
			"EPSG:25832",
			"EPSG:4326",
			"EPSG:3857",
		]);
		expect(layers["lakes"]?.geographicBoundingBox).toEqual([5, 47, 15, 55]);
		expect(layers["forests"]?.geographicBoundingBox).toEqual([
			8, 49, 9, 50,
		]);
		expect(layers["lakes"]?.queryable).toBe(true);
		expect(layers["forests"]?.queryable).toBe(false);
	});

	it("passes the version and keeps query parameters of the GetMap URL", () => {
		const entry = wmsCapabilitiesToLayers(WMS_111)[0]!;

		expect(entry.definition).toMatchObject({
			options: {
				source: {
					options: {
						url: "https://legacy.example.org/wms?map=demo&",
						params: {VERSION: "1.1.1", FORMAT: "image/png"},
					},
				},
			},
		});
	});
});
