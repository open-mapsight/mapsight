import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import LazyMapboxVectorLayer from "./LazyMapboxVectorLayer";

// These tests run against the real ol-mapbox-style (no mock) with a stubbed
// `fetch`, so no network access is needed.

const styleUrl = "https://styles.example.org/maps/base.json";
const tileJson = {
	tilejson: "2.2.0",
	tiles: ["https://tiles.example.org/{z}/{x}/{y}.pbf"],
	minzoom: 0,
	maxzoom: 14,
};

function createStyle(sourceUrl: string) {
	return {
		version: 8,
		sources: {base: {type: "vector", url: sourceUrl}},
		layers: [
			{
				id: "water",
				type: "fill",
				source: "base",
				"source-layer": "water",
				paint: {"fill-color": "#00f"},
			},
		],
	};
}

/**
 * Stubs `fetch`: the style document is answered once `releaseStyle` is
 * called, everything else (the TileJSON) immediately.
 */
function stubFetch(sourceUrl: string) {
	const requested: string[] = [];
	let releaseStyle!: () => void;
	const styleReleased = new Promise<void>((resolve) => {
		releaseStyle = resolve;
	});
	const json = (body: unknown) =>
		({
			ok: true,
			status: 200,
			json: () => Promise.resolve(body),
		}) as Response;
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: URL | string | Request) => {
			const url = input instanceof Request ? input.url : String(input);
			requested.push(url);
			if (url === styleUrl) {
				await styleReleased;
				return json(createStyle(sourceUrl));
			}
			return json(structuredClone(tileJson));
		}),
	);
	return {requested, releaseStyle};
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 20));

describe("LazyMapboxVectorLayer with ol-mapbox-style", () => {
	beforeEach(() => {
		vi.stubGlobal("location", {href: "https://app.example.org/embed/"});
	});
	afterEach(() => vi.unstubAllGlobals());

	it("resolves a relative source URL against styleUrl when transforming", async () => {
		const {requested, releaseStyle} = stubFetch(
			"tiles/world-transformed.json",
		);
		const layer = new LazyMapboxVectorLayer({
			styleUrl,
			layers: ["water"],
			background: false,
			styleTransforms: [
				{
					op: "setLayerProperties",
					selector: {ids: ["water"]},
					properties: {paint: {"fill-color": "#f00"}},
				},
			],
		});
		const errors: unknown[] = [];
		layer.on("error", (event) =>
			errors.push((event as unknown as {error: unknown}).error),
		);
		releaseStyle();

		await vi.waitFor(() =>
			expect(layer.getSource()?.getState(), String(errors[0])).toBe(
				"ready",
			),
		);
		expect(requested).toContain(
			"https://styles.example.org/maps/tiles/world-transformed.json",
		);
		expect(layer.getSource()?.getUrls()).toEqual(tileJson.tiles);
	});

	it("does not attach a source to a layer disposed while the style loads", async () => {
		const {requested, releaseStyle} = stubFetch(
			"tiles/world-disposed.json",
		);
		const layer = new LazyMapboxVectorLayer({
			styleUrl,
			layers: ["water"],
			background: false,
		});
		await vi.waitFor(() => expect(requested).toContain(styleUrl));

		layer.dispose();
		releaseStyle();
		await flush();

		expect(layer.getSource()).toBeNull();
	});
});
