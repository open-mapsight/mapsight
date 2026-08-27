import {afterEach, describe, expect, it, vi} from "vitest";

import {create} from "../index";
import browserEmbed from "./browser";

const minimalConfig = {
	map: {layers: {base: {type: "OSM" as const}}},
};

function stubRenderer() {
	return vi.fn((_container: unknown, _props: unknown, _hydrate?: boolean) => {
		return undefined;
	});
}

describe("browserEmbed hydration contract", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("boots with a valid minimal config and stub renderer", () => {
		const container = document.createElement("div");
		const renderer = stubRenderer();

		const render = browserEmbed(container, {
			styleFunction: vi.fn(),
			baseMapsightConfig: minimalConfig,
			createOptions: {
				renderer,
				plugins: [],
				validateConfig: true,
			},
		});

		expect(render).toEqual(expect.any(Function));
		expect(renderer).toHaveBeenCalledOnce();
		expect(renderer.mock.calls[0]?.[2]).toBe(false);
	});

	it("hydrates from data-dehydrated-state and clears the attribute", () => {
		const container = document.createElement("div");
		container.setAttribute(
			"data-dehydrated-state",
			JSON.stringify({
				app: {title: "from-ssr"},
			}),
		);
		const renderer = stubRenderer();

		browserEmbed(container, {
			styleFunction: vi.fn(),
			baseMapsightConfig: minimalConfig,
			createOptions: {
				renderer,
				plugins: [],
				validateConfig: false,
			},
		});

		expect(renderer).toHaveBeenCalledOnce();
		expect(renderer.mock.calls[0]?.[2]).toBe(true);
		expect(container.getAttribute("data-dehydrated-state")).toBe("");
	});

	it("warns on invalid config in development via browserEmbed but still boots", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.stubGlobal("process", {
			...process,
			env: {...process.env, NODE_ENV: "development"},
		});
		const container = document.createElement("div");
		const renderer = stubRenderer();
		const invalid = {map: {layers: {x: {options: {}}}}};

		expect(() =>
			browserEmbed(container, {
				styleFunction: vi.fn(),
				baseMapsightConfig: invalid,
				createOptions: {
					renderer,
					plugins: [],
					validateConfig: true,
				},
			}),
		).not.toThrow();

		expect(warn).toHaveBeenCalledWith(
			"[mapsight] Config validation failed:",
			expect.stringContaining("[create()]"),
		);
		expect(renderer).toHaveBeenCalledOnce();
	});

	it("continues client-only when dehydrated state attribute is missing", () => {
		const container = document.createElement("div");
		const renderer = stubRenderer();

		expect(() =>
			browserEmbed(container, {
				styleFunction: vi.fn(),
				baseMapsightConfig: minimalConfig,
				createOptions: {
					renderer,
					plugins: [],
					validateConfig: false,
				},
			}),
		).not.toThrow();

		expect(renderer.mock.calls[0]?.[2]).toBe(false);
	});

	it("continues client-only when dehydrated state JSON is invalid", () => {
		const container = document.createElement("div");
		container.setAttribute("data-dehydrated-state", "{not-json");
		const renderer = stubRenderer();
		const error = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() =>
			browserEmbed(container, {
				styleFunction: vi.fn(),
				baseMapsightConfig: minimalConfig,
				createOptions: {
					renderer,
					plugins: [],
					validateConfig: false,
				},
			}),
		).not.toThrow();

		expect(error).toHaveBeenCalled();
		expect(renderer).toHaveBeenCalledOnce();
		expect(renderer.mock.calls[0]?.[2]).toBe(false);
		expect(container.getAttribute("data-dehydrated-state")).toBe(
			"{not-json",
		);
	});
});

describe("create config contract", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("accepts a valid minimal config", () => {
		const container = document.createElement("div");
		const renderer = stubRenderer();

		const ctx = create(container, vi.fn(), minimalConfig, {
			renderer,
			plugins: [],
			validateConfig: true,
		});

		expect(ctx.render).toEqual(expect.any(Function));
		ctx.render?.({});
		expect(renderer).toHaveBeenCalledOnce();
	});

	it("warns on invalid config in development but still creates", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.stubGlobal("process", {
			...process,
			env: {...process.env, NODE_ENV: "development"},
		});
		const container = document.createElement("div");
		const invalid = {map: {layers: {x: {options: {}}}}};

		const ctx = create(container, vi.fn(), invalid as never, {
			renderer: stubRenderer(),
			plugins: [],
			validateConfig: true,
		});

		expect(warn).toHaveBeenCalledWith(
			"[mapsight] Config validation failed:",
			expect.stringContaining("[create()]"),
		);
		expect(ctx.render).toEqual(expect.any(Function));
	});

	it("first render hydrates when reHydratedState is supplied", () => {
		const container = document.createElement("div");
		const renderer = stubRenderer();

		const ctx = create(container, vi.fn(), minimalConfig, {
			renderer,
			plugins: [],
			validateConfig: false,
			reHydratedState: {
				app: {listQuery: "hydrated-query"},
			},
		});

		expect(ctx.isStateReHydrated).toBe(true);
		ctx.render?.({});
		expect(renderer.mock.calls[0]?.[2]).toBe(true);
	});
});
