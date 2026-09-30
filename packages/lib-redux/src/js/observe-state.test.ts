import type {AnyAction} from "@reduxjs/toolkit";
import {configureStore} from "@reduxjs/toolkit";
import {describe, expect, it, vi} from "vitest";

import {
	AbortObserving,
	getAndObserveState,
	observeState,
	observeStateOnce,
} from "./observe-state";

function reducer(state = {count: 0}, action: AnyAction) {
	if (action.type === "increment") {
		return {count: state.count + 1};
	}
	return state;
}

describe("observeState", () => {
	it("reports selected changes and can be unsubscribed", () => {
		const store = configureStore({reducer});
		const listener = vi.fn();
		const unsubscribe = observeState(
			store,
			(state) => state.count,
			listener,
		);

		store.dispatch({type: "unchanged"});
		store.dispatch({type: "increment"});

		expect(listener).toHaveBeenCalledOnce();
		expect(listener).toHaveBeenCalledWith(1, 0, {count: 1});

		unsubscribe();
		store.dispatch({type: "increment"});
		expect(listener).toHaveBeenCalledOnce();
	});

	it("supports custom comparison and listener-requested aborts", () => {
		const store = configureStore({reducer});
		const listener = vi.fn(
			(
				_newValue: number,
				_oldValue: number | null,
			): typeof AbortObserving => AbortObserving,
		);
		observeState(
			store,
			(state) => state.count,
			listener,
			(previous, next) => Number(previous) % 2 === Number(next) % 2,
		);

		store.dispatch({type: "increment"});
		store.dispatch({type: "increment"});

		expect(listener).toHaveBeenCalledOnce();
	});
});

describe("observeStateOnce", () => {
	it("unsubscribes after the first selected change", () => {
		const store = configureStore({reducer});
		const listener = vi.fn();
		observeStateOnce(
			store,
			(state: {count: number}) => state.count,
			listener,
		);

		store.dispatch({type: "increment"});
		store.dispatch({type: "increment"});

		expect(listener).toHaveBeenCalledOnce();
		expect(listener).toHaveBeenCalledWith(1, 0, {count: 1});
	});
});

describe("getAndObserveState", () => {
	it("reports the current value immediately and observes later changes", () => {
		const store = configureStore({reducer});
		const listener = vi.fn();
		getAndObserveState(store, (state) => state.count, listener);

		expect(listener).toHaveBeenCalledWith(0, null, {count: 0});

		store.dispatch({type: "increment"});
		expect(listener).toHaveBeenLastCalledWith(1, 0, {count: 1});
	});

	it("does not subscribe when the initial listener aborts", () => {
		const store = configureStore({reducer});
		const listener = vi.fn(
			(
				_newValue: number,
				_oldValue: number | null,
			): typeof AbortObserving => AbortObserving,
		);
		getAndObserveState(store, (state) => state.count, listener);

		store.dispatch({type: "increment"});

		expect(listener).toHaveBeenCalledOnce();
	});
});
