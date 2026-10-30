import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import type {LoadOptions} from "@mapsight/core/lib/feature-sources/actions";
import type {
	FeatureSourceData,
	FeatureSourcesState,
} from "@mapsight/core/lib/feature-sources/types";

import nodeEmbed from "../../embed/node";
import createAwaitListPlugin from "./render-await-list-feature-sources-loaded";

const collection: FeatureSourceData = {
	type: "FeatureCollection",
	features: [
		{
			id: "poi",
			type: "Feature",
			properties: {name: "Museum"},
			geometry: {type: "Point", coordinates: [10, 52]},
		},
	],
};
const xhrSource = {type: "xhr-json", url: "/pois.geojson"};

function embedFor(
	featureSources: Record<string, unknown>,
	listSource = "pois",
	loadOptions?: LoadOptions,
) {
	return nodeEmbed({
		styleFunction: vi.fn(() => undefined),
		baseMapsightConfig: {
			map: {layers: {}},
			list: {featureSource: listSource},
			featureSources,
		},
		createOptions: {
			validateConfig: false,
			uiState: {map: {show: false}, list: {show: false}},
			renderer: () => "<p>ready</p>",
			plugins: [["awaitList", createAwaitListPlugin({loadOptions})]],
		},
	});
}
function sourcesOf(embed: ReturnType<typeof embedFor>): FeatureSourcesState {
	const state: unknown = embed.store?.getState();
	return (
		(state as {featureSources?: FeatureSourcesState} | undefined)
			?.featureSources ?? {}
	);
}

async function expectReady(embed: ReturnType<typeof embedFor>) {
	let rendered: string | undefined;
	let error: unknown;
	void embed.renderAsync().then(
		(value) => {
			rendered = value;
		},
		(cause) => {
			error = cause;
		},
	);
	await vi.advanceTimersByTimeAsync(100);
	expect(error).toBeUndefined();
	expect(rendered).toBe("<p>ready</p>");
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
	vi.clearAllTimers();
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("SSR list-source await targets", () => {
	it("renders map-only/default-list configurations without creating a missing source", async () => {
		const fetch = vi.fn();
		vi.stubGlobal("fetch", fetch);
		const embed = embedFor({}, "unconfigured-default-list");
		await expectReady(embed);
		expect(sourcesOf(embed)).not.toHaveProperty(
			"unconfigured-default-list",
		);
		expect(fetch).not.toHaveBeenCalled();
	});

	it.each(["offline", ""])(
		"renders an already-failed source without waiting for a skipped retry (%j)",
		async (error) => {
			const fetch = vi.fn();
			vi.stubGlobal("fetch", fetch);
			const embed = embedFor({pois: {...xhrSource, error}});
			await expectReady(embed);
			expect(sourcesOf(embed).pois?.error).toBe(error);
			expect(fetch).not.toHaveBeenCalled();
		},
	);

	it("finishes normally when a configured noop source completes with no data", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const embed = embedFor({pois: {type: "noop"}});
		await expectReady(embed);
		expect(sourcesOf(embed).pois?.isLoading).toBe(false);
		expect(sourcesOf(embed).pois?.error).toBe("no data");
	});

	it("keeps waiting for configured first-paint data even when the list shell is disabled", async () => {
		const fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				status: 200,
				headers: {get: () => null},
				json: () => Promise.resolve(collection),
			}),
		);
		vi.stubGlobal("fetch", fetch);
		const embed = embedFor({pois: xhrSource});
		await expectReady(embed);
		expect(fetch).toHaveBeenCalledOnce();
		expect(sourcesOf(embed).pois?.ids).toEqual(["poi"]);
	});

	it("still force-refreshes a failed configured source when requested", async () => {
		const fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				status: 200,
				headers: {get: () => null},
				json: () => Promise.resolve(collection),
			}),
		);
		vi.stubGlobal("fetch", fetch);
		const embed = embedFor(
			{pois: {...xhrSource, error: "offline"}},
			"pois",
			{forceRefresh: true},
		);
		await expectReady(embed);
		expect(fetch).toHaveBeenCalledOnce();
		expect(sourcesOf(embed).pois?.ids).toEqual(["poi"]);
		expect(sourcesOf(embed).pois?.error).toBeUndefined();
	});

	it("loads configured combined members while ignoring unconfigured member ids", async () => {
		const fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				status: 200,
				headers: {get: () => null},
				json: () => Promise.resolve(collection),
			}),
		);
		vi.stubGlobal("fetch", fetch);
		const embed = embedFor(
			{
				pois: xhrSource,
				combined: {
					type: "combined",
					featureSourceNames: ["missing", "pois"],
				},
			},
			"combined",
		);
		await expectReady(embed);
		expect(fetch).toHaveBeenCalledOnce();
		expect(sourcesOf(embed)).not.toHaveProperty("missing");
		expect(sourcesOf(embed).combined?.ids).toEqual(["poi"]);
	});

	it("renders a combined source whose only member is unconfigured", async () => {
		const embed = embedFor(
			{combined: {type: "combined", featureSourceNames: ["missing"]}},
			"combined",
		);
		await expectReady(embed);
		expect(sourcesOf(embed)).not.toHaveProperty("missing");
		expect(sourcesOf(embed).combined?.ids).toEqual([]);
	});
});
