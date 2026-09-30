import type {Reducer} from "@reduxjs/toolkit";
import {describe, expect, it, vi} from "vitest";

import createImmutablePathReducer from "./create-immutable-path-reducer";

describe("createImmutablePathReducer", () => {
	it("replaces the root when no path is provided", () => {
		const replacement = {value: 2};
		const reducer = vi.fn(() => replacement);
		const state = {value: 1};

		const nextState = createImmutablePathReducer(reducer)(state, {
			type: "replace",
		});

		expect(reducer).toHaveBeenCalledWith(state, {type: "replace"});
		expect(nextState).toBe(replacement);
	});

	it("clones only objects along a nested path", () => {
		const stable = {stable: true};
		const untouched = {value: 3};
		const state = {
			nested: {
				target: {value: 1},
				stable,
			},
			untouched,
		};
		const reducer: Reducer = (value: {value: number}) => ({
			value: value.value + 1,
		});

		const nextState = createImmutablePathReducer(reducer)(state, {
			type: "increment",
			path: ["nested", "target"],
		}) as typeof state;

		expect(nextState).not.toBe(state);
		expect(nextState.nested).not.toBe(state.nested);
		expect(nextState.nested.target).toEqual({value: 2});
		expect(nextState.nested.stable).toBe(stable);
		expect(nextState.untouched).toBe(untouched);
	});

	it("keeps every reference when the nested value is unchanged", () => {
		const state = {nested: {value: 1}};
		const reducer: Reducer = (value) => value;

		const nextState = createImmutablePathReducer(reducer)(state, {
			type: "unchanged",
			path: ["nested"],
		});

		expect(nextState).toBe(state);
		expect((nextState as typeof state).nested).toBe(state.nested);
	});
});
