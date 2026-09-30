import type {AnyAction} from "@reduxjs/toolkit";
import {configureStore} from "@reduxjs/toolkit";
import {describe, expect, it, vi} from "vitest";

import enableControlledDispatchAndObserve, {
	type StoreExtControlledActions,
} from "./enable-controlled-dispatch-and-observe";

function countReducer(state = 0, action: AnyAction) {
	if (action.type === "increment") {
		return state + 1;
	}
	return state;
}

function createEnhancedStore() {
	const store = configureStore({reducer: countReducer});
	enableControlledDispatchAndObserve(store);
	return store as typeof store & StoreExtControlledActions<number>;
}

describe("enableControlledDispatchAndObserve", () => {
	it("notifies for uncontrolled actions and skips controlled actions", () => {
		const store = createEnhancedStore();
		const listener = vi.fn();
		const unsubscribe = store.subscribeUncontrolled(listener);

		store.dispatch({type: "increment"});
		store.dispatch({
			type: "increment",
			meta: {isControlled: true},
		});

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith(0, 1);
		expect(store.getState()).toBe(2);

		unsubscribe();
		store.dispatch({type: "increment"});
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("observes selected values only when the comparator reports a change", () => {
		const store = createEnhancedStore();
		const listener = vi.fn();
		store.observeUncontrolled(
			(state) => state,
			listener,
			(previous, next) =>
				(previous as number) % 2 === (next as number) % 2,
		);

		store.dispatch({type: "increment"});
		store.dispatch({type: "unchanged"});

		expect(listener).toHaveBeenCalledOnce();
		expect(listener).toHaveBeenCalledWith(1, 0, 1);
	});

	it("handles controlled dispatches nested in an uncontrolled listener", () => {
		const store = createEnhancedStore();
		const listener = vi.fn(() => {
			if (store.getState() === 1) {
				store.dispatch({
					type: "increment",
					meta: {isControlled: true},
				});
			}
		});
		store.subscribeUncontrolled(listener);

		store.dispatch({type: "increment"});

		expect(store.getState()).toBe(2);
		expect(listener).toHaveBeenCalledOnce();
		expect(listener).toHaveBeenCalledWith(0, 1);
	});

	it("treats a nested batch reduced in one dispatch as one action", () => {
		function batchedReducer(state = 0, action: AnyAction): number {
			if (action.type === "batch" && Array.isArray(action.payload)) {
				return action.payload.reduce<number>(
					(current, child: AnyAction) =>
						batchedReducer(current, child),
					state,
				);
			}
			return countReducer(state, action);
		}
		const store = configureStore({reducer: batchedReducer});
		enableControlledDispatchAndObserve(store);
		const enhancedStore = store as typeof store &
			StoreExtControlledActions<number>;
		const listener = vi.fn();
		enhancedStore.subscribeUncontrolled(listener);

		enhancedStore.dispatch({
			type: "batch",
			payload: [
				{type: "increment"},
				{
					type: "batch",
					payload: [{type: "increment"}],
				},
			],
		});

		expect(enhancedStore.getState()).toBe(2);
		expect(listener).toHaveBeenCalledOnce();
		expect(listener).toHaveBeenCalledWith(0, 2);
	});
});
