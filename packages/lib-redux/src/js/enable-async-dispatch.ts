import type {AnyAction, Store} from "@reduxjs/toolkit";

function runAsync(fn: () => void) {
	return setTimeout(() => fn(), 10);
}

function isRecord(val: unknown): val is Record<keyof any, unknown> {
	return typeof val === "object" && val !== null;
}

/**
 * Enhances the stores dispatch function, so you can dispatch actions flagged as async.
 * This allows "dispatching while dispatching" by queueing actions that are dispatched while dispatching is already
 * in progress and dispatching them after finishing with the current action.
 *
 * The action is guaranteed to be dispatched asynchronously in any case (even when dispatching is possible immediately).
 *
 * @param store redux store to be enhanced (having dispatch)
 * @param asyncActionFlag flag that async actions expose (action[actionFlag] == true)
 */
export default function enableAsyncDispatch(
	store: Store,
	asyncActionFlag: string | symbol = "isAsync",
) {
	// This function will override the store.dispatch method, deferring the actual dispatch of actions flagged as
	// async by queueing them and only dispatching them in the next microtask by scheduling them with setTimeout.
	let isAsyncScheduled = false;
	const actionQueue: Array<AnyAction> = [];

	const baseDispatch = store.dispatch;

	function isActionAsync(action: AnyAction) {
		return isRecord(action.meta) && !!action.meta[asyncActionFlag];
	}

	function runScheduleAsyncDispatch() {
		isAsyncScheduled = false;

		while (actionQueue.length) {
			const action = actionQueue.shift() as AnyAction;
			baseDispatch(action);
		}
	}

	function scheduleAsyncDispatch() {
		if (!isAsyncScheduled) {
			isAsyncScheduled = true;
			runAsync(runScheduleAsyncDispatch);
		}
	}

	store.dispatch = (action) => {
		if (isActionAsync(action)) {
			actionQueue.push(action);
			scheduleAsyncDispatch();
			return action;
		}

		return baseDispatch(action);
	};
}
