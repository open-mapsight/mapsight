import type {AnyAction, Reducer} from "@reduxjs/toolkit";
import {describe, expect, it, vi} from "vitest";

import combineSubPathReducers from "./combine-sub-path-reducers";
import createFilteredReducerForPath from "./create-filtered-reducer-for-path";

describe("combineSubPathReducers", () => {
	it("routes matching paths and removes the first segment", () => {
		const left = vi.fn((state = 0, action: AnyAction) =>
			action.type === "increment" ? state + 1 : state,
		);
		const right = vi.fn((state = 0) => state);
		const reducer = combineSubPathReducers({left, right});
		const initialState = reducer(undefined, {type: "initialize"});
		left.mockClear();
		right.mockClear();
		const action = {
			type: "increment",
			meta: {path: ["left", "child"]},
		};

		const nextState = reducer(initialState, action);

		expect(nextState).toEqual({left: 1, right: 0});
		expect(left).toHaveBeenCalledWith(
			0,
			expect.objectContaining({path: ["child"]}),
		);
		expect(right).not.toHaveBeenCalled();
		expect(action).toEqual({
			type: "increment",
			meta: {path: ["left", "child"]},
		});
	});

	it("returns the same state when no subpath matches", () => {
		const reducer = combineSubPathReducers({
			left: (state = 0) => state,
			right: (state = 0) => state,
		});
		const initialState = reducer(undefined, {type: "initialize"});

		const nextState = reducer(initialState, {
			type: "ignored",
			meta: {path: ["missing"]},
		});

		expect(nextState).toBe(initialState);
	});
});

describe("createFilteredReducerForPath", () => {
	it("forwards matching paths with their first segment removed", () => {
		const baseReducer = vi.fn((state = 0) => state + 1);
		const reducer = createFilteredReducerForPath(
			baseReducer as Reducer,
			"target",
		);

		const nextState = reducer(0, {
			type: "increment",
			meta: {path: ["target", "child"]},
		});

		expect(nextState).toBe(1);
		expect(baseReducer).toHaveBeenCalledWith(
			0,
			expect.objectContaining({path: ["child"]}),
		);
	});

	it("ignores mismatched paths and forwards actions without paths", () => {
		const baseReducer = vi.fn((state = 0) => state + 1);
		const reducer = createFilteredReducerForPath(
			baseReducer as Reducer,
			"target",
		);
		const state = {value: 1};

		expect(
			reducer(state, {
				type: "ignored",
				meta: {path: ["other"]},
			}),
		).toBe(state);
		expect(baseReducer).not.toHaveBeenCalled();

		reducer(0, {type: "unscoped"});
		expect(baseReducer).toHaveBeenCalledWith(0, {type: "unscoped"});
	});
});
