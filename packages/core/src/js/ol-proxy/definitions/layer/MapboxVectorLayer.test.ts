import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {type LayerProxyDefinition, updateProxyObject} from "@/ol-proxy";
import DependencyManager from "@/ol-proxy/DependencyManager";

import LazyMapboxVectorLayer from "./LazyMapboxVectorLayer";
import MapboxVectorLayer from "./MapboxVectorLayer";

vi.mock("ol-mapbox-style", () => ({
	applyStyle: vi.fn().mockResolvedValue(undefined),
	applyBackground: vi.fn().mockResolvedValue(undefined),
}));

const transforms = [
	{
		op: "setLayerProperties",
		selector: {types: ["fill"]},
		properties: {paint: {"fill-color": "#f00"}},
	},
];

describe("MapboxVectorLayer definition", () => {
	const di = new DependencyManager();
	di.injectDefinitions([MapboxVectorLayer]);

	// Mirrors how a host updates a layer: the previous object and description
	// go in, and the adder/remover track the instance that is current.
	let current: LazyMapboxVectorLayer | undefined;
	let removed: LazyMapboxVectorLayer[];
	type Options = NonNullable<LayerProxyDefinition["options"]>;
	function update(oldOptions: Options | undefined, newOptions: Options) {
		updateProxyObject<LazyMapboxVectorLayer>({
			di,
			oldObject: current,
			oldDefinition: oldOptions && {
				type: "MapboxVectorLayer",
				options: oldOptions,
			},
			newDefinition: {type: "MapboxVectorLayer", options: newOptions},
			adder: (layer) => {
				current = layer;
			},
			remover: (layer) => {
				removed.push(layer);
			},
		});
	}

	beforeEach(() => {
		vi.stubGlobal("location", {href: "https://app.example.org/embed/"});
		current = undefined;
		removed = [];
		vi.stubGlobal(
			"fetch",
			vi.fn(() =>
				Promise.resolve({
					ok: true,
					status: 200,
					json: () =>
						Promise.resolve({
							version: 8,
							sources: {},
							layers: [
								{
									id: "water",
									type: "fill",
									paint: {"fill-color": "#00f"},
								},
							],
						}),
				}),
			),
		);
	});
	afterEach(() => vi.unstubAllGlobals());

	it("passes styleTransforms to the layer as an initial option", async () => {
		const {applyStyle} = await import("ol-mapbox-style");
		update(undefined, {
			styleUrl: "/styles/base.json",
			styleTransforms: transforms,
		});
		expect(current).toBeInstanceOf(LazyMapboxVectorLayer);

		await vi.waitFor(() => expect(applyStyle).toHaveBeenCalled());
		const glStyle = vi.mocked(applyStyle).mock.calls.at(-1)?.[1] as {
			layers: Array<{paint: unknown}>;
		};
		expect(glStyle.layers[0]?.paint).toEqual({"fill-color": "#f00"});
	});

	it("recreates the layer when styleTransforms or styleUrl change", () => {
		const base = {
			styleUrl: "/styles/base.json",
			styleTransforms: transforms,
			visible: false,
		};
		update(undefined, base);
		const first = current;

		// Deeply equal options keep the layer.
		update(base, {...base, styleTransforms: structuredClone(transforms)});
		expect(current).toBe(first);
		expect(removed).toEqual([]);

		update(base, {
			...base,
			styleTransforms: [
				{...transforms[0], properties: {paint: {"fill-color": "#0f0"}}},
			],
		});
		const second = current;
		expect(second).not.toBe(first);
		expect(removed).toEqual([first]);

		update(
			{...base, styleTransforms: transforms},
			{...base, styleUrl: "/styles/other.json"},
		);
		expect(current).not.toBe(second);
		expect(removed).toEqual([first, second]);
	});

	it("keeps the layer when only live options such as visibility change", () => {
		const base = {styleUrl: "/styles/base.json", visible: false};
		update(undefined, base);
		const first = current;
		update(base, {...base, opacity: 0.5});
		expect(current).toBe(first);
		expect(first?.getOpacity()).toBe(0.5);
	});
});
