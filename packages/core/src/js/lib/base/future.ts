import get from "lodash/get";
import isPlainObject from "lodash/isPlainObject";

import {UNSET_ACTION_FLAG} from "@/lib/base/actions";
import {ACTION_REMOVE_KEY, ACTION_SET} from "@/lib/base/reducer";
import type {Action} from "@/types";

/**
 * Opt-in switches for the next major of `@mapsight/core`, set per store with the
 * `future` option of `createMapsightStore`. `true` is the next major's behavior
 * now, omitted or `false` is today's behavior. Names are `v{major}_{behavior}`;
 * a key is removed when its major ships. See Decision 012.
 */
export type FutureFlags = {
	/**
	 * `unset(path)` deletes the key from its parent object instead of leaving it
	 * in the state with an `undefined` value. Elements of arrays are still set
	 * to `undefined`, and a plain `set(path, undefined)` is unchanged. Default
	 * `false`. This will be the only behavior in v15.
	 */
	v15_unsetRemovesKey?: boolean;
};

/**
 * Turns an `unset` action into a `removeKey` action when its parent is a plain
 * object. Every other action, and every `unset` of an array element, of a
 * missing parent or of a whole controller state, is returned as it is.
 *
 * The action is expected as the controller reducers get it: `action.path` is
 * relative to `state` (the controller prefix is already cut off).
 */
export function resolveUnsetAction<TAction extends Action>(
	state: unknown,
	action: TAction,
): TAction {
	if (
		action.type !== ACTION_SET ||
		action.meta?.[UNSET_ACTION_FLAG] !== true
	) {
		return action;
	}

	const path = action.path as Array<string | number> | undefined;
	if (!Array.isArray(path) || !path.length) {
		return action;
	}

	const parent: unknown =
		path.length === 1 ? state : get(state, path.slice(0, -1));
	if (!isPlainObject(parent)) {
		return action;
	}

	const removeAction: Action = {...action, type: ACTION_REMOVE_KEY};
	delete removeAction.value;
	return removeAction as TAction;
}
