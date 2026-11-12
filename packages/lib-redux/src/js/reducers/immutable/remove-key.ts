import type {AnyAction, Reducer} from "@reduxjs/toolkit";
import isPlainObject from "lodash/isPlainObject";

/**
 * Deletes the own key `action.key` from a plain object state.
 *
 * Returns the same state reference when the state is not a plain object (arrays
 * included, use `removeFrom` for those) or does not own the key.
 */
const removeKeyReducer: Reducer = <T>(state: T, action: AnyAction): T => {
	const key = action.key as PropertyKey;

	if (
		!isPlainObject(state) ||
		!Object.prototype.hasOwnProperty.call(state, key)
	) {
		return state;
	}

	const {[key as string]: _removed, ...rest} = state as Record<
		string,
		unknown
	>;

	return rest as T;
};

export default removeKeyReducer;
