import {applyBackground, applyStyle} from "ol-mapbox-style";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import LazyMapboxVectorLayer from "./LazyMapboxVectorLayer";
import type {MapboxStyleTransform} from "./mapboxStyleTransforms";

vi.mock("ol-mapbox-style", () => ({
	applyStyle: vi.fn().mockResolvedValue(undefined),
	applyBackground: vi.fn().mockResolvedValue(undefined),
}));

describe("LazyMapboxVectorLayer webfonts", () => {
	beforeEach(() => vi.clearAllMocks());

	it("passes the font template when a hidden layer is first shown", () => {
		const layer = new LazyMapboxVectorLayer({
			styleUrl: "/map-assets/styles/base.json",
			visible: false,
			background: false,
			webfonts: "/map-assets/fonts/{font-family}/{fontweight}.css",
		});
		expect(applyStyle).not.toHaveBeenCalled();
		layer.setVisible(true);
		expect(applyStyle).toHaveBeenCalledWith(
			layer,
			"/map-assets/styles/base.json",
			undefined,
			{
				accessToken: undefined,
				webfonts: "/map-assets/fonts/{font-family}/{fontweight}.css",
			},
		);
		layer.setVisible(false);
		layer.setVisible(true);
		expect(applyStyle).toHaveBeenCalledTimes(1);
	});
});

describe("LazyMapboxVectorLayer styleTransforms", () => {
	const styleUrl = "https://styles.example.org/maps/base.json";
	const style = {
		version: 8,
		sprite: "../sprites/base",
		glyphs: "fonts/{fontstack}/{range}.pbf",
		sources: {base: {type: "vector", url: "tiles.json"}},
		layers: [
			{id: "bg", type: "background", paint: {"background-color": "#fff"}},
			{
				id: "water",
				type: "fill",
				source: "base",
				"source-layer": "water",
				paint: {"fill-color": "#00f"},
			},
		],
	};
	const transforms: MapboxStyleTransform[] = [
		{
			op: "setLayerProperties",
			selector: {types: ["fill"]},
			properties: {paint: {"fill-color": "#f00"}},
		},
	];

	function respondWith(response: Partial<Response> | Error) {
		const fetchMock = vi.fn((_input: URL | string, _init?: RequestInit) =>
			response instanceof Error
				? Promise.reject(response)
				: Promise.resolve({
						ok: true,
						status: 200,
						json: () => Promise.resolve(structuredClone(style)),
						...response,
					} as Response),
		);
		vi.stubGlobal("fetch", fetchMock);
		return fetchMock;
	}

	function createLayer(
		options: Partial<
			ConstructorParameters<typeof LazyMapboxVectorLayer>[0]
		>,
	) {
		return new LazyMapboxVectorLayer({
			styleUrl,
			webfonts: "/fonts/{font-family}.css",
			accessToken: "token",
			layers: ["water"],
			...options,
		});
	}

	beforeEach(() => vi.clearAllMocks());
	afterEach(() => vi.unstubAllGlobals());

	it("passes the transformed style object to ol-mapbox-style", async () => {
		const fetchMock = respondWith({});
		const layer = createLayer({styleTransforms: transforms});
		const failed = vi.fn();
		layer.on("error", failed);

		await vi.waitFor(() =>
			expect(layer.getSource()?.getState()).toBe("ready"),
		);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(String(fetchMock.mock.calls[0]?.[0])).toBe(styleUrl);
		expect(applyStyle).toHaveBeenCalledTimes(1);
		const [target, glStyle, layers, options] = vi.mocked(applyStyle).mock
			.calls[0] as unknown as [unknown, typeof style, string[], object];
		expect(target).toBe(layer);
		expect(glStyle.layers[1]?.paint).toEqual({"fill-color": "#f00"});
		expect(glStyle.layers[0]?.paint).toEqual({"background-color": "#fff"});
		expect(glStyle.sources).toEqual(style.sources);
		expect(layers).toEqual(["water"]);
		expect(options).toEqual({
			accessToken: "token",
			webfonts: "/fonts/{font-family}.css",
			styleUrl,
		});
		// The background comes from the transformed style as well.
		expect(applyBackground).toHaveBeenCalledTimes(1);
		const [, backgroundStyle] = vi.mocked(applyBackground).mock
			.calls[0] as unknown as [unknown, typeof style];
		expect(backgroundStyle.layers[1]?.paint).toEqual({
			"fill-color": "#f00",
		});
		expect(failed).not.toHaveBeenCalled();
	});

	it("keeps resolving relative style URLs against the original styleUrl", async () => {
		vi.stubGlobal("location", {href: "https://app.example.org/embed/"});
		const fetchMock = respondWith({});
		createLayer({
			styleUrl: "/map-assets/styles/base.json?v=1",
			styleTransforms: transforms,
		});
		await vi.waitFor(() => expect(applyStyle).toHaveBeenCalled());

		// Sprite, glyph and source URLs stay relative inside the style ...
		const [, glStyle, , options] = vi.mocked(applyStyle).mock
			.calls[0] as unknown as [
			unknown,
			typeof style,
			unknown,
			{styleUrl: string},
		];
		expect(glStyle.sprite).toBe("../sprites/base");
		expect(glStyle.glyphs).toBe("fonts/{fontstack}/{range}.pbf");
		expect(glStyle.sources.base.url).toBe("tiles.json");
		// ... and ol-mapbox-style resolves them against this URL.
		expect(options.styleUrl).toBe("/map-assets/styles/base.json?v=1");
		expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
			"https://app.example.org/map-assets/styles/base.json?v=1",
		);
	});

	it("does not fetch the style itself without transforms", () => {
		const fetchMock = respondWith({});
		createLayer({styleTransforms: undefined, background: false});
		createLayer({styleTransforms: [], background: false});

		expect(fetchMock).not.toHaveBeenCalled();
		expect(applyStyle).toHaveBeenCalledTimes(2);
		for (const call of vi.mocked(applyStyle).mock.calls) {
			expect(call[1]).toBe(styleUrl);
			expect(call[3]).toEqual({
				accessToken: "token",
				webfonts: "/fonts/{font-family}.css",
			});
		}
	});

	it("defers the fetch until a hidden layer is shown, and runs once", async () => {
		const fetchMock = respondWith({});
		const layer = createLayer({
			visible: false,
			styleTransforms: transforms,
		});
		expect(fetchMock).not.toHaveBeenCalled();

		layer.setVisible(true);
		layer.setVisible(false);
		layer.setVisible(true);
		await vi.waitFor(() => expect(applyStyle).toHaveBeenCalled());
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(applyStyle).toHaveBeenCalledTimes(1);
	});

	it.each([
		[
			"a failed request",
			() => respondWith(new TypeError("network down")),
			/network down/,
		],
		[
			"an HTTP error",
			() => respondWith({ok: false, status: 404}),
			/Error fetching style .*base\.json: HTTP 404/,
		],
		[
			"invalid JSON",
			() =>
				respondWith({
					json: () => Promise.reject(new SyntaxError("bad json")),
				}),
			/bad json/,
		],
	])("reports %s like a failed style load", async (_name, setup, message) => {
		setup();
		const layer = createLayer({styleTransforms: transforms});
		const errors: unknown[] = [];
		layer.on("error", (event) =>
			errors.push((event as unknown as {error: unknown}).error),
		);

		await vi.waitFor(() =>
			expect(layer.getSource()?.getState()).toBe("error"),
		);
		expect(errors).toHaveLength(1);
		expect(String(errors[0])).toMatch(message);
		expect(applyStyle).not.toHaveBeenCalled();
	});

	it("reports invalid transforms as a style load error", async () => {
		respondWith({});
		const layer = createLayer({
			styleTransforms: [{op: "removeLayersById", ids: ["bg"]}] as never,
		});
		const errors: unknown[] = [];
		layer.on("error", (event) =>
			errors.push((event as unknown as {error: unknown}).error),
		);

		await vi.waitFor(() =>
			expect(layer.getSource()?.getState()).toBe("error"),
		);
		expect(String(errors[0])).toMatch(/index 0.*unsupported op/);
		expect(applyStyle).not.toHaveBeenCalled();
	});

	it("reports a rejected ol-mapbox-style call", async () => {
		respondWith({});
		vi.mocked(applyStyle).mockRejectedValueOnce(new Error("no source"));
		const layer = createLayer({styleTransforms: transforms});

		await vi.waitFor(() =>
			expect(layer.getSource()?.getState()).toBe("error"),
		);
	});

	it("rejects style URLs that cannot be fetched directly", async () => {
		const fetchMock = respondWith({});
		const layer = createLayer({
			styleUrl: "mapbox://styles/example/base",
			styleTransforms: transforms,
		});
		const errors: unknown[] = [];
		layer.on("error", (event) =>
			errors.push((event as unknown as {error: unknown}).error),
		);

		await vi.waitFor(() =>
			expect(layer.getSource()?.getState()).toBe("error"),
		);
		expect(String(errors[0])).toMatch(/http\(s\) or relative styleUrl/);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
