import type {AnyAction, Reducer} from "@reduxjs/toolkit";

import createImmutablePathReducer from "../../create-immutable-path-reducer";
import removeKey from "../immutable/remove-key";

const reduceParent = createImmutablePathReducer(removeKey);

/**
 * Deletes the key at the last segment of `action.path` from its parent object.
 * Parents along the path get new references, siblings keep theirs. The state
 * stays unchanged (same reference) when the parent or the key does not exist.
 */
const removeKeyPathReducer: Reducer = <T>(state: T, action: AnyAction): T => {
	const path = action.path as Array<string | number> | undefined;

	if (!path?.length) {
		return state;
	}

	return reduceParent(state, {
		...action,
		path: path.slice(0, -1),
		key: path[path.length - 1],
	}) as T;
};

export default removeKeyPathReducer;
