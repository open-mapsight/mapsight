import _map from "lodash/map";
// using underscores to prevent confusion with action names
import {batchActions} from "redux-batched-actions";

import {
	ACTION_ADD_TO,
	ACTION_MERGE,
	ACTION_REMOVE_FROM,
	ACTION_SET,
} from "@/lib/base/reducer";
import type {Action, ActionOrThunk, BatchedAction} from "@/types";

export const ASYNC_ACTION_FLAG = "MAPSIGHT_ASYNC_ACTION";
export const CONTROLLED_ACTION_FLAG = "MAPSIGHT_CONTROLLED_ACTION";
export const QUIET_ACTION_FLAG = "MAPSIGHT_QUIET_ACTION";

export const STATE_PATH_KEY = "path";

const ERROR_MESSAGE_EMPTY_PATH = "required path is missing in action";

export type PathItem = string | number;
export type ActionPath = Array<PathItem>;
type NonEmptyActionPath = [PathItem, ...Array<PathItem>];

export function isBatchedAction(action: Action): action is BatchedAction {
	return action.meta ? "batch" in action.meta && action.meta.batch : false;
}

export function controlled(action: Action) {
	action.meta = action.meta || {};
	action.meta[CONTROLLED_ACTION_FLAG] = true;

	if (isBatchedAction(action)) {
		action.payload = action.payload.map((batchedAction) =>
			controlled(batchedAction),
		);
	}

	return action;
}

export function quiet<T extends ActionOrThunk = ActionOrThunk>(action: T): T {
	action.meta = action.meta || {};
	action.meta[QUIET_ACTION_FLAG] = true;

	if ("payload" in action && isBatchedAction(action)) {
		action.payload = action.payload.map((batchedAction) =>
			quiet(batchedAction),
		);
	}

	return action;
}

export function async<T extends ActionOrThunk = ActionOrThunk>(action: T): T {
	action.meta = action.meta || {};
	action.meta[ASYNC_ACTION_FLAG] = true;

	return action;
}

// type guard path is not empty (length > 0)
export function throwOnEmptyPath(
	path: ActionPath | null,
): asserts path is NonEmptyActionPath {
	if (!Array.isArray(path) || !path.length) {
		throw new Error(ERROR_MESSAGE_EMPTY_PATH);
	}
}

export function withPath(action: Action, path: ActionPath | null = null) {
	if (path) {
		action.meta = action.meta || {};
		action.meta[STATE_PATH_KEY] = path;

		if (isBatchedAction(action)) {
			action.payload = action.payload.map((batchedAction) =>
				withPath(batchedAction, path),
			);
		}
	}

	return action;
}

function allKeys(fn: (path: ActionPath, value: unknown) => Action) {
	return function (
		path: ActionPath | Record<PathItem, unknown>,
		options: Record<PathItem, unknown> = {},
	) {
		const hasPath = Array.isArray(path);
		const actionPath = hasPath ? path : [];
		const actionOptions = hasPath ? options : path;

		const actions = _map(actionOptions, (option, key) =>
			fn(actionPath.concat([key]), option),
		);

		return batchActions(actions);
	};
}

export function set(path: ActionPath | null, value: unknown) {
	throwOnEmptyPath(path);

	return withPath(
		{
			type: ACTION_SET,
			value,
		},
		path,
	);
}

export const setAll = allKeys(set);

export function merge(path: ActionPath | null, value: unknown) {
	throwOnEmptyPath(path);

	return withPath(
		{
			type: ACTION_MERGE,
			value,
		},
		path,
	);
}

export const mergeAll = allKeys(merge);

export function addTo(path: ActionPath | null, element: unknown) {
	throwOnEmptyPath(path);

	return withPath(
		{
			type: ACTION_ADD_TO,
			element,
		},
		path,
	);
}

export const addToAll = allKeys(addTo);

export function unset(path: ActionPath | null) {
	throwOnEmptyPath(path);

	return set(path, undefined);
}

export function removeFrom(path: ActionPath | null, element: unknown) {
	throwOnEmptyPath(path);

	return withPath(
		{
			type: ACTION_REMOVE_FROM,
			element,
		},
		path,
	);
}

export const removeFromAll = allKeys(removeFrom);
