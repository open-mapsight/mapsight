import {describe, expect, it, vi} from "vitest";

import {createEmbedBag} from "./index";
import {normalizeBrowserEmbedOptions} from "./normalize-legacy-options";

vi.mock("../plugins/browser-defaults", () => ({
	default: (options: object) => [
		["lang", {afterCreate: () => undefined}],
		["views", {afterCreate: () => options}],
	],
}));

vi.mock("../plugins/browser/partial-content-changed-event", () => ({
	default: () => ({afterCreate: () => undefined}),
}));

describe("normalizeBrowserEmbedOptions", () => {
	it("passes through modern flat options without default plugins", () => {
		const styleFunction = vi.fn();
		const normalized = normalizeBrowserEmbedOptions({
			styleFunction,
			baseMapsightConfig: {map: {}},
			createOptions: {plugins: [["custom", null]]},
		});

		expect(normalized.styleFunction).toBe(styleFunction);
		expect(normalized.baseMapsightConfig).toEqual({map: {}});
		expect(normalized.createOptions?.plugins).toEqual([["custom", null]]);
	});

	it("prefers live legacy bag mutations after createEmbedBag", () => {
		const styleFunction = vi.fn();
		const bag = createEmbedBag(
			styleFunction,
			{layers: {a: 1}},
			{},
			{view: "desktop"},
			{
				defaultPluginsOptions: {
					views: {determineInitialView: () => "desktop"},
				},
				hook: () => undefined,
				plugins: [["host", null]],
			},
		);

		bag.baseMapsightCoreConfig = {
			...bag.baseMapsightCoreConfig,
			layers: {a: 1, b: 2},
		};
		bag.embedOptions.imagesUrl = "/assets/img/";

		const normalized = normalizeBrowserEmbedOptions(bag);

		expect(normalized.baseMapsightConfig).toEqual({
			layers: {a: 1, b: 2},
		});
		expect(normalized.createOptions?.imagesUrl).toBe("/assets/img/");
		expect(normalized.createOptions?.uiState).toEqual({view: "desktop"});
		expect(
			normalized.createOptions?.plugins?.map(([name]) => name),
		).toEqual([
			"lang",
			"views",
			"partialContentChangedEvent",
			"host",
			"legacyEmbedHook",
		]);
		expect(normalized.createOptions?.partialChangeHandler).toBeTypeOf(
			"function",
		);
	});

	it("supports useDefaultPlugins on modern createOptions", () => {
		const styleFunction = vi.fn();
		const normalized = normalizeBrowserEmbedOptions({
			styleFunction,
			baseMapsightConfig: {},
			createOptions: {
				useDefaultPlugins: true,
				plugins: [["host", null]],
			},
		});

		expect(
			normalized.createOptions?.plugins?.map(([name]) => name),
		).toEqual(["lang", "views", "partialContentChangedEvent", "host"]);
		// No legacy bag → do not auto-bridge the process hub
		expect(normalized.createOptions?.partialChangeHandler).toBeUndefined();
	});
});
