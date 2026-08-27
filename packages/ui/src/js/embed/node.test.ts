import {afterEach, describe, expect, it, vi} from "vitest";

import browserEmbed from "./browser";
import nodeEmbed from "./node";

const minimalConfig = {
	map: {layers: {base: {type: "OSM" as const}}},
};

function stubServerRenderer(html = "<div class='shell'>ssr</div>") {
	return vi.fn(() => html);
}

describe("nodeEmbed SSR emit contract", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("render returns the server HTML shell", () => {
		const renderer = stubServerRenderer("<p>shell</p>");
		const embed = nodeEmbed({
			styleFunction: vi.fn(),
			baseMapsightConfig: minimalConfig,
			createOptions: {
				renderer,
				plugins: [],
				validateConfig: false,
			},
		});

		const html = embed.render({});
		expect(html).toBe("<p>shell</p>");
		expect(renderer).toHaveBeenCalledOnce();
	});

	it("emitFragment wraps shell html with data-dehydrated-state", () => {
		const embed = nodeEmbed({
			styleFunction: vi.fn(),
			baseMapsightConfig: minimalConfig,
			createOptions: {
				renderer: stubServerRenderer("<span>list</span>"),
				plugins: [],
				validateConfig: false,
				uiState: {title: "sidecar-title"},
			},
		});

		embed.render({});
		const fragment = embed.emitFragment({id: "mapsight-embed-demo"});

		expect(fragment).toContain('id="mapsight-embed-demo"');
		expect(fragment).toContain("<span>list</span>");
		expect(fragment).toContain("data-dehydrated-state='");
		expect(fragment).toContain("sidecar-title");
	});

	it("round-trips emitFragment into browserEmbed hydration", () => {
		const server = nodeEmbed({
			styleFunction: vi.fn(),
			baseMapsightConfig: minimalConfig,
			createOptions: {
				renderer: stubServerRenderer("<div>ssr-shell</div>"),
				plugins: [],
				validateConfig: false,
				uiState: {title: "round-trip"},
			},
		});
		server.render({});
		const fragment = server.emitFragment({id: "round-trip"});

		const container = document.createElement("div");
		container.innerHTML = fragment;
		const embedRoot = container.firstElementChild as HTMLElement;
		expect(embedRoot?.id).toBe("round-trip");

		const emitted = JSON.parse(
			embedRoot.getAttribute("data-dehydrated-state") ?? "null",
		);
		expect(emitted?.app?.title).toBe("round-trip");

		const clientRenderer = vi.fn(
			(_c: unknown, _p: unknown, _hydrate?: boolean) => undefined,
		);
		browserEmbed(embedRoot, {
			styleFunction: vi.fn(),
			baseMapsightConfig: minimalConfig,
			createOptions: {
				renderer: clientRenderer,
				plugins: [],
				validateConfig: false,
			},
		});

		expect(clientRenderer.mock.calls[0]?.[2]).toBe(true);
		expect(embedRoot.getAttribute("data-dehydrated-state")).toBe("");
	});

	it("does not emit in-flight feature source loading flags", () => {
		const embed = nodeEmbed({
			styleFunction: vi.fn(),
			baseMapsightConfig: {
				...minimalConfig,
				featureSources: {
					pois: {
						type: "xhr-json",
						url: "/pois.geojson",
						isLoading: true,
						data: null,
					},
				},
			},
			createOptions: {
				renderer: stubServerRenderer("<div>shell</div>"),
				plugins: [],
				validateConfig: false,
			},
		});
		embed.render({});

		const fragment = embed.emitFragment({id: "loading-ssr"});
		const container = document.createElement("div");
		container.innerHTML = fragment;
		const state = JSON.parse(
			container.firstElementChild?.getAttribute(
				"data-dehydrated-state",
			) ?? "null",
		);

		expect(embed.store?.getState().featureSources?.pois?.isLoading).toBe(
			true,
		);
		expect(state.featureSources.pois.isLoading).toBe(false);
	});
});
