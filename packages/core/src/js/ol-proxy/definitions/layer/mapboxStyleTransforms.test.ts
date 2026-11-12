import {describe, expect, it} from "vitest";

import {
	type MapboxStyleDocument,
	type MapboxStyleTransform,
	applyMapboxStyleTransforms,
} from "./mapboxStyleTransforms";

function createStyle(): MapboxStyleDocument {
	return {
		version: 8,
		sprite: "sprites/base",
		sources: {base: {type: "vector", url: "tiles.json"}},
		layers: [
			{
				id: "background",
				type: "background",
				paint: {"background-color": "#fff"},
			},
			{
				id: "water-fill",
				type: "fill",
				source: "base",
				"source-layer": "water",
				paint: {"fill-color": "#00f", "fill-opacity": 0.5},
			},
			{
				id: "water-line",
				type: "line",
				source: "base",
				"source-layer": "water",
				paint: {"line-color": "#00a"},
				layout: {"line-cap": "round"},
			},
			{
				id: "road-label",
				type: "symbol",
				source: "base",
				"source-layer": "road",
				minzoom: 10,
				filter: ["==", "class", "primary"],
				layout: {"text-field": "{name}", "text-font": ["Regular"]},
				paint: {"text-color": "#000"},
			},
		],
	};
}

function transform(
	selector: Record<string, unknown> | undefined,
	properties: Record<string, unknown>,
): MapboxStyleTransform {
	return {
		op: "setLayerProperties",
		selector,
		properties,
	};
}

function layerOf(style: MapboxStyleDocument, id: string) {
	return (style.layers as Array<Record<string, unknown>>).find(
		(layer) => layer.id === id,
	);
}

function changedIds(
	before: MapboxStyleDocument,
	after: MapboxStyleDocument,
): string[] {
	return (before.layers as Array<Record<string, unknown>>)
		.filter(
			(layer, index) =>
				JSON.stringify(layer) !== JSON.stringify(after.layers?.[index]),
		)
		.map((layer) => layer.id as string);
}

describe("applyMapboxStyleTransforms selectors", () => {
	const properties = {paint: {marker: 1}};

	it.each([
		["omitted", undefined],
		["empty", {}],
	])("matches all layers with an %s selector", (_name, selector) => {
		const style = createStyle();
		const result = applyMapboxStyleTransforms(style, [
			transform(selector, properties),
		]);
		expect(changedIds(style, result)).toEqual([
			"background",
			"water-fill",
			"water-line",
			"road-label",
		]);
	});

	it("matches ids, prefixes, sourceLayers and types", () => {
		const style = createStyle();
		const run = (selector: Record<string, unknown>) =>
			changedIds(
				style,
				applyMapboxStyleTransforms(style, [
					transform(selector, properties),
				]),
			);
		expect(run({ids: ["water-line"]})).toEqual(["water-line"]);
		expect(run({prefixes: ["water-"]})).toEqual([
			"water-fill",
			"water-line",
		]);
		expect(run({sourceLayers: ["road"]})).toEqual(["road-label"]);
		expect(run({types: ["fill", "symbol"]})).toEqual([
			"water-fill",
			"road-label",
		]);
	});

	it("combines values within a field with OR", () => {
		const style = createStyle();
		const result = applyMapboxStyleTransforms(style, [
			transform({prefixes: ["back", "road"]}, properties),
		]);
		expect(changedIds(style, result)).toEqual(["background", "road-label"]);
	});

	it("combines fields with AND", () => {
		const style = createStyle();
		const result = applyMapboxStyleTransforms(style, [
			transform({sourceLayers: ["water"], types: ["line"]}, properties),
		]);
		expect(changedIds(style, result)).toEqual(["water-line"]);
	});

	it("matches no layer for a field with an empty list", () => {
		const style = createStyle();
		const result = applyMapboxStyleTransforms(style, [
			transform({ids: []}, properties),
		]);
		expect(changedIds(style, result)).toEqual([]);
	});

	it("rejects unknown selector fields", () => {
		expect(() =>
			applyMapboxStyleTransforms(createStyle(), [
				transform({id: ["water-fill"]}, {}),
			]),
		).toThrow(/index 0.*unknown selector field "id"/);
	});

	it("rejects selector values that are not string arrays", () => {
		expect(() =>
			applyMapboxStyleTransforms(createStyle(), [
				transform({ids: "water-fill"}, {}),
			]),
		).toThrow(/index 0.*"ids" must be an array of strings/);
		expect(() =>
			applyMapboxStyleTransforms(createStyle(), [
				transform({types: ["fill", 1]}, {}),
			]),
		).toThrow(/"types" must be an array of strings/);
		expect(() =>
			applyMapboxStyleTransforms(createStyle(), [
				{op: "setLayerProperties", selector: []} as never,
			]),
		).toThrow(/"selector" must be an object/);
	});
});

describe("applyMapboxStyleTransforms properties", () => {
	it("merges paint and layout entries by name and removes entries set to null", () => {
		const result = applyMapboxStyleTransforms(createStyle(), [
			transform(
				{ids: ["water-fill", "water-line"]},
				{
					paint: {
						"fill-color": "#f00",
						"fill-opacity": null,
						"line-width": 2,
					},
					layout: {visibility: "none", "line-cap": null},
				},
			),
		]);
		expect(layerOf(result, "water-fill")).toMatchObject({
			paint: {"fill-color": "#f00", "line-width": 2},
			layout: {visibility: "none"},
		});
		expect(layerOf(result, "water-fill")?.paint).not.toHaveProperty(
			"fill-opacity",
		);
		expect(layerOf(result, "water-line")).toMatchObject({
			paint: {"line-color": "#00a", "line-width": 2},
			layout: {visibility: "none"},
		});
		expect(layerOf(result, "water-line")?.layout).not.toHaveProperty(
			"line-cap",
		);
	});

	it("drops paint or layout when its last entry is removed", () => {
		const result = applyMapboxStyleTransforms(createStyle(), [
			transform(
				{ids: ["background"]},
				{paint: {"background-color": null}},
			),
		]);
		expect(layerOf(result, "background")).toEqual({
			id: "background",
			type: "background",
		});
	});

	it("replaces filter, minzoom and maxzoom, and removes them with null", () => {
		const filter = ["any", ["==", "class", "a"], ["has", "name"]];
		const result = applyMapboxStyleTransforms(createStyle(), [
			transform({ids: ["road-label"]}, {filter, minzoom: 4, maxzoom: 12}),
			transform({ids: ["water-fill"]}, {minzoom: null, maxzoom: 9}),
		]);
		expect(layerOf(result, "road-label")).toMatchObject({
			filter,
			minzoom: 4,
			maxzoom: 12,
		});
		expect(layerOf(result, "water-fill")).toMatchObject({maxzoom: 9});

		const removed = applyMapboxStyleTransforms(result, [
			transform({ids: ["road-label"]}, {filter: null, minzoom: null}),
		]);
		expect(layerOf(removed, "road-label")).not.toHaveProperty("filter");
		expect(layerOf(removed, "road-label")).not.toHaveProperty("minzoom");
		expect(layerOf(removed, "road-label")).toHaveProperty("maxzoom", 12);
	});

	it("copies expressions verbatim instead of merging them", () => {
		const color = [
			"interpolate",
			["linear"],
			["zoom"],
			5,
			"#aaa",
			10,
			["get", "colour"],
		];
		const result = applyMapboxStyleTransforms(createStyle(), [
			transform({ids: ["water-fill"]}, {paint: {"fill-color": color}}),
		]);
		expect(layerOf(result, "water-fill")?.paint).toEqual({
			"fill-color": color,
			"fill-opacity": 0.5,
		});
	});

	it("rejects unknown properties and wrong value types", () => {
		const run = (properties: Record<string, unknown>) => () =>
			applyMapboxStyleTransforms(createStyle(), [
				transform({}, properties),
			]);
		expect(run({source: "other"})).toThrow(
			/index 0.*unknown property "source"/,
		);
		expect(run({paint: null})).toThrow(/"paint" must be an object/);
		expect(run({layout: []})).toThrow(/"layout" must be an object/);
		expect(run({minzoom: "4"})).toThrow(
			/"minzoom" must be a number or null/,
		);
		expect(run({maxzoom: Number.NaN})).toThrow(
			/"maxzoom" must be a number/,
		);
		expect(run({filter: "class"})).toThrow(/"filter" must be/);
		expect(run({paint: JSON.parse('{"__proto__": 1}')})).toThrow(
			/invalid name/,
		);
	});

	it("accepts omitted or null selector and properties", () => {
		const style = createStyle();
		expect(
			applyMapboxStyleTransforms(style, [
				{op: "setLayerProperties"},
				{
					op: "setLayerProperties",
					selector: null,
					properties: null,
				} as never,
			]),
		).toEqual(style);
	});
});

describe("applyMapboxStyleTransforms document handling", () => {
	it("runs transforms in order", () => {
		const result = applyMapboxStyleTransforms(createStyle(), [
			transform({types: ["fill"]}, {paint: {"fill-color": "#111"}}),
			transform({ids: ["water-fill"]}, {paint: {"fill-color": "#222"}}),
			transform({types: ["fill"]}, {paint: {"fill-opacity": 1}}),
		]);
		expect(layerOf(result, "water-fill")?.paint).toEqual({
			"fill-color": "#222",
			"fill-opacity": 1,
		});
	});

	it("does not mutate the style or the transforms", () => {
		const style = createStyle();
		const snapshot = structuredClone(style);
		const transforms = [
			transform({types: ["fill"]}, {paint: {"fill-color": ["get", "c"]}}),
		];
		const transformsSnapshot = structuredClone(transforms);

		const result = applyMapboxStyleTransforms(style, transforms);

		expect(style).toEqual(snapshot);
		expect(transforms).toEqual(transformsSnapshot);
		expect(result).not.toBe(style);
		// Mutating the result must not leak into the inputs either.
		(layerOf(result, "water-fill")?.paint as Record<string, unknown>)[
			"fill-color"
		] = "changed";
		(
			(transforms[0] as {properties: {paint: Record<string, unknown[]>}})
				.properties.paint["fill-color"] as unknown[]
		)[1] = "other";
		expect(layerOf(result, "road-label")).toEqual(
			layerOf(snapshot, "road-label"),
		);
		expect(style).toEqual(snapshot);
	});

	it("leaves sources, sprite and unrelated layers untouched", () => {
		const style = createStyle();
		const result = applyMapboxStyleTransforms(style, [
			transform({types: ["symbol"]}, {paint: {"text-color": "#fff"}}),
		]);
		expect(result.sources).toEqual(style.sources);
		expect(result.sprite).toBe(style.sprite);
		expect(changedIds(style, result)).toEqual(["road-label"]);
	});

	it("returns a copy for an empty transform list and styles without layers", () => {
		const style = createStyle();
		const same = applyMapboxStyleTransforms(style, []);
		expect(same).toEqual(style);
		expect(same).not.toBe(style);
		expect(
			applyMapboxStyleTransforms({version: 8}, [transform({}, {})]),
		).toEqual({version: 8});
	});
});

describe("applyMapboxStyleTransforms validation", () => {
	it("rejects any op but setLayerProperties and names the index", () => {
		expect(() =>
			applyMapboxStyleTransforms(createStyle(), [
				transform({}, {}),
				{op: "removeLayersById", ids: ["background"]} as never,
			]),
		).toThrow(/index 1.*unsupported op "removeLayersById"/);
		expect(() =>
			applyMapboxStyleTransforms(createStyle(), [{} as never]),
		).toThrow(/index 0.*unsupported op undefined/);
	});

	it("rejects transforms that are not objects", () => {
		expect(() =>
			applyMapboxStyleTransforms(createStyle(), [null as never]),
		).toThrow(/index 0.*expected an object, got null/);
		expect(() =>
			applyMapboxStyleTransforms(createStyle(), "nope" as never),
		).toThrow(/expected an array/);
	});

	it("rejects unknown transform fields", () => {
		expect(() =>
			applyMapboxStyleTransforms(createStyle(), [
				{op: "setLayerProperties", property: {}} as never,
			]),
		).toThrow(/index 0.*unknown field "property"/);
	});

	it("validates every transform before changing anything", () => {
		const style = createStyle();
		expect(() =>
			applyMapboxStyleTransforms(style, [
				transform({}, {paint: {x: 1}}),
				transform({nope: []}, {}),
			]),
		).toThrow(/index 1/);
		expect(style).toEqual(createStyle());
	});
});
