import {describe, expect, it} from "vitest";

import reducers from "./index";

type Item = {a?: number; b?: number; nested?: {c: number}};

const makeState = () => ({
	list: [{a: 1, b: 2}, {a: 3}] as Item[],
	other: {kept: true},
});

describe("path reducers through an array ancestor", () => {
	it("set keeps the array and its siblings", () => {
		const state = makeState();

		const next = reducers.set(state, {
			type: "set",
			path: ["list", 0, "a"],
			value: 10,
		}) as typeof state;

		expect(Array.isArray(next.list)).toBe(true);
		expect(next.list).toEqual([{a: 10, b: 2}, {a: 3}]);
		expect(next.list).not.toBe(state.list);
		expect(next.list[0]).not.toBe(state.list[0]);
		expect(next.list[1]).toBe(state.list[1]);
		expect(next.other).toBe(state.other);
		expect(state.list[0]?.a).toBe(1);
	});

	it("merge keeps the array and its siblings", () => {
		const state = makeState();

		const next = reducers.merge(state, {
			type: "merge",
			path: ["list", 1],
			value: {b: 4},
		}) as typeof state;

		expect(Array.isArray(next.list)).toBe(true);
		expect(next.list).toEqual([
			{a: 1, b: 2},
			{a: 3, b: 4},
		]);
		expect(next.list[0]).toBe(state.list[0]);
	});

	it("removeKey deletes the key and keeps the array", () => {
		const state = makeState();

		const next = reducers.removeKey(state, {
			type: "removeKey",
			path: ["list", 0, "a"],
		}) as typeof state;

		expect(Array.isArray(next.list)).toBe(true);
		expect(next.list).toEqual([{b: 2}, {a: 3}]);
		expect(next.list[1]).toBe(state.list[1]);
		expect(next.other).toBe(state.other);
		expect(state.list[0]).toEqual({a: 1, b: 2});
	});

	it("keeps arrays on every level of a deeper path", () => {
		const state = {rows: [{cells: [{v: 1}, {v: 2}]}]};

		const next = reducers.set(state, {
			type: "set",
			path: ["rows", 0, "cells", 1, "v"],
			value: 5,
		}) as typeof state;

		expect(next).toEqual({rows: [{cells: [{v: 1}, {v: 5}]}]});
		expect(Array.isArray(next.rows)).toBe(true);
		expect(Array.isArray(next.rows[0]?.cells)).toBe(true);
	});

	it("keeps an array as root state", () => {
		const state = [{a: 1}, {a: 2}];

		const next = reducers.set(state, {
			type: "set",
			path: [1, "a"],
			value: 3,
		}) as typeof state;

		expect(Array.isArray(next)).toBe(true);
		expect(next).toEqual([{a: 1}, {a: 3}]);
		expect(next[0]).toBe(state[0]);
	});

	it("still creates plain objects for missing ancestors", () => {
		const next: unknown = reducers.set(
			{},
			{
				type: "set",
				path: ["list", 0, "a"],
				value: 1,
			},
		);

		expect(next).toEqual({list: {0: {a: 1}}});
	});

	it("returns the same state when removeKey finds nothing to remove", () => {
		const state = makeState();

		expect(
			reducers.removeKey(state, {
				type: "removeKey",
				path: ["list", 0, "missing"],
			}),
		).toBe(state);
	});
});
