import {describe, expect, it} from "vitest";

import pathReducers from "../immutable-path";
import immutableRemoveKey from "./remove-key";

const removeKey = (state: unknown, path: Array<string | number>): unknown =>
	pathReducers.removeKey(state, {type: "remove-key", path}) as unknown;

describe("removeKey", () => {
	it("deletes an own key from a plain object", () => {
		const state = {a: 1, b: 2};
		const next = immutableRemoveKey(state, {
			type: "x",
			key: "a",
		}) as unknown;

		expect(next).toEqual({b: 2});
		expect("a" in (next as object)).toBe(false);
		expect(state).toEqual({a: 1, b: 2});
	});

	it("returns the same reference for missing keys and non-plain-object states", () => {
		const state = {a: 1};
		const array = ["a", "b"];

		expect(immutableRemoveKey(state, {type: "x", key: "missing"})).toBe(
			state,
		);
		// inherited keys are not own keys
		expect(immutableRemoveKey(state, {type: "x", key: "toString"})).toBe(
			state,
		);
		expect(immutableRemoveKey(array, {type: "x", key: 0})).toBe(array);
		expect(immutableRemoveKey(null, {type: "x", key: "a"})).toBe(null);
		expect(immutableRemoveKey(undefined, {type: "x", key: "a"})).toBe(
			undefined,
		);
	});

	it("deletes keys whose value is undefined", () => {
		const next = immutableRemoveKey(
			{a: undefined, b: 1},
			{
				type: "x",
				key: "a",
			},
		) as unknown;

		expect("a" in (next as object)).toBe(false);
	});
});

describe("removeKey (immutable path)", () => {
	it("removes the key at the path and replaces only the parents along it", () => {
		const siblingLayer = {id: "b"};
		const untouched = {other: true};
		const state = {
			map: {layers: {a: {id: "a"}, b: siblingLayer}, view: {zoom: 1}},
			untouched,
		};

		const next = removeKey(state, ["map", "layers", "a"]) as typeof state;

		expect(next).not.toBe(state);
		expect(next.map).not.toBe(state.map);
		expect(next.map.layers).not.toBe(state.map.layers);
		expect(Object.keys(next.map.layers)).toEqual(["b"]);
		expect(next.map.layers.b).toBe(siblingLayer);
		expect(next.map.view).toBe(state.map.view);
		expect(next.untouched).toBe(untouched);
		expect(Object.keys(state.map.layers)).toEqual(["a", "b"]);
	});

	it("removes a key of the root object", () => {
		const state = {a: 1, b: 2};

		expect(removeKey(state, ["a"])).toEqual({b: 2});
	});

	it("returns the same state when the key or its parent does not exist", () => {
		const state = {map: {layers: {a: {id: "a"}}}};

		expect(removeKey(state, ["map", "layers", "missing"])).toBe(state);
		expect(removeKey(state, ["map", "sources", "a"])).toBe(state);
		expect(removeKey(state, ["nothing", "here", "a"])).toBe(state);
		expect(removeKey(state, ["map", "layers", "a", "id", "x"])).toBe(state);
	});

	it("leaves the state unchanged when the parent is an array", () => {
		const state = {list: ["a", "b"]};

		expect(removeKey(state, ["list", 0])).toBe(state);
		expect(removeKey(state, ["list", "length"])).toBe(state);
	});

	it("leaves the state unchanged without a path", () => {
		const state = {a: 1};

		expect(pathReducers.removeKey(state, {type: "x"})).toBe(state);
		expect(pathReducers.removeKey(state, {type: "x", path: []})).toBe(
			state,
		);
	});
});
