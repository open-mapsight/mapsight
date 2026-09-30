import {afterEach, describe, expect, it, vi} from "vitest";

import {create} from "./index";
import type {PluginDefinition} from "./types";

const minimalConfig = {
	map: {layers: {base: {type: "OSM" as const}}},
};

function createWithPlugins(plugins: PluginDefinition[]) {
	const renderer = vi.fn(() => "rendered");
	const context = create(null, vi.fn(), minimalConfig, {
		renderer,
		plugins,
		validateConfig: false,
	});
	return {context, renderer};
}

describe("create plugin phases", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("keeps rendering and calls later plugins when a plugin throws synchronously", () => {
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		const later = vi.fn();
		const {context, renderer} = createWithPlugins([
			[
				"broken",
				{
					beforeRender() {
						throw new Error("boom");
					},
				},
			],
			["later", {beforeRender: later}],
		]);

		expect(context.render?.({})).toBe("rendered");
		expect(renderer).toHaveBeenCalledOnce();
		expect(later).toHaveBeenCalledOnce();
		expect(consoleError).toHaveBeenCalledWith(
			expect.stringContaining('"broken"'),
			expect.objectContaining({message: "boom"}),
		);
	});

	it("rejects renderAsync after calling every plugin when one throws synchronously", async () => {
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		const later = vi.fn();
		const {context, renderer} = createWithPlugins([
			[
				"broken",
				{
					beforeRender() {
						throw new Error("boom");
					},
				},
			],
			["later", {beforeRender: later}],
		]);

		await expect(context.renderAsync?.({})).rejects.toThrow("boom");
		expect(later).toHaveBeenCalledOnce();
		expect(renderer).not.toHaveBeenCalled();
	});

	it("does not let a throwing afterCreate plugin escape create", () => {
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		const later = vi.fn();

		expect(() =>
			createWithPlugins([
				[
					"broken",
					{
						afterCreate() {
							throw new Error("boom");
						},
					},
				],
				["later", {afterCreate: later}],
			]),
		).not.toThrow();
		expect(later).toHaveBeenCalledOnce();
	});
});
