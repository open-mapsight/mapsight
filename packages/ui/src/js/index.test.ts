import {afterEach, describe, expect, it, vi} from "vitest";

import {create} from "./index";
import type {MapsightUiRendererProps, PluginDefinition} from "./types";

const minimalConfig = {
	map: {layers: {base: {type: "OSM" as const}}},
};

function createWithPlugins(plugins: PluginDefinition[]) {
	const renderer = vi.fn(() => "rendered");
	const context = create(
		null,
		vi.fn(() => undefined),
		minimalConfig,
		{
			renderer,
			plugins,
			validateConfig: false,
		},
	);
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

describe("renderer commit lifecycle", () => {
	it("keeps the synchronous renderer return and plugin timing by default", () => {
		const afterRender = vi.fn();
		const {context} = createWithPlugins([["commit", {afterRender}]]);
		expect(context.render?.({})).toBe("rendered");
		expect(context.hasRendered).toBe(true);
		expect(afterRender).toHaveBeenCalledOnce();
	});

	it("waits for an explicit commit and ignores duplicate or superseded signals", () => {
		const commits: Array<() => void> = [];
		const afterRender = vi.fn();
		const renderer = vi.fn(
			(
				_container: HTMLElement | null,
				props: MapsightUiRendererProps,
				_hydrate?: boolean,
			) => {
				commits.push(props.deferCommit!());
				return "root";
			},
		);
		const context = create(
			null,
			vi.fn(() => undefined),
			minimalConfig,
			{
				renderer,
				reHydratedState: {app: {}},
				plugins: [["commit", {afterRender}]],
				validateConfig: false,
			},
		);
		expect(context.render?.({})).toBe("root");
		expect(context.hasRendered).toBe(false);
		expect(afterRender).not.toHaveBeenCalled();
		expect(renderer.mock.calls[0]?.[2]).toBe(true);

		context.render?.({});
		expect(renderer.mock.calls[1]?.[2]).toBe(false);
		commits[0]?.();
		expect(afterRender).not.toHaveBeenCalled();
		commits[1]?.();
		commits[1]?.();
		expect(context.hasRendered).toBe(true);
		expect(afterRender).toHaveBeenCalledOnce();
	});

	it("sets renderRef before plugins even when commit is signaled synchronously", () => {
		const afterRender = vi.fn((context) => {
			expect(context.renderRef).toBe("root");
			expect(context.hasRendered).toBe(true);
		});
		const context = create(
			null,
			vi.fn(() => undefined),
			minimalConfig,
			{
				renderer: (_container, props) => {
					props.deferCommit?.()();
					return "root";
				},
				plugins: [["commit", {afterRender}]],
				validateConfig: false,
			},
		);
		context.render?.({});
		expect(afterRender).toHaveBeenCalledOnce();
	});

	it("renderAsync waits for beforeRender, while commit remains renderer-controlled", async () => {
		let commit: (() => void) | undefined;
		const afterRender = vi.fn();
		const beforeRender = vi.fn(() => Promise.resolve());
		const context = create(
			null,
			vi.fn(() => undefined),
			minimalConfig,
			{
				renderer: (_container, props) => {
					commit = props.deferCommit?.();
					return "root";
				},
				plugins: [["commit", {beforeRender, afterRender}]],
				validateConfig: false,
			},
		);
		expect(await context.renderAsync?.({})).toBe("root");
		expect(beforeRender).toHaveBeenCalledOnce();
		expect(afterRender).not.toHaveBeenCalled();
		commit?.();
		expect(afterRender).toHaveBeenCalledOnce();
	});

	it("does not report a commit when the renderer throws", () => {
		let commit: (() => void) | undefined;
		const afterRender = vi.fn();
		const context = create(
			null,
			vi.fn(() => undefined),
			minimalConfig,
			{
				renderer: (_container, props) => {
					commit = props.deferCommit?.();
					throw new Error("render failed");
				},
				plugins: [["commit", {afterRender}]],
				validateConfig: false,
			},
		);
		expect(() => context.render?.({})).toThrow("render failed");
		commit?.();
		expect(context.hasRendered).toBe(false);
		expect(afterRender).not.toHaveBeenCalled();
	});
});
