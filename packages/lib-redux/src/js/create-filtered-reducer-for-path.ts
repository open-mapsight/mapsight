import type {AnyAction, Reducer} from "@reduxjs/toolkit";

import cloneAction from "./clone-action";

/**
 * Filters the actions, so the reducer only gets actions without a path or
 * a path matching the given key.
 *
 * @param reducer the base reducer that should get filtered actions only
 * @param key key of the action parameter that contains the path array
 * @param [statePathMetaKey] name of the meta field that contains the path array (action.meta.path), default: 'path'
 * @returns resulting reducer
 */
function createFilteredReducerForPath(
	reducer: Reducer,
	key: string,
	statePathMetaKey = "path",
): Reducer {
	const filteredReducer: Reducer = <T extends Record<string, unknown>>(
		state: T,
		action: AnyAction,
	) => {
		if (typeof action.meta === "object") {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
			const path = action.meta[statePathMetaKey];
			if (Array.isArray(path) && path.length) {
				if (path[0] !== key) {
					return state;
				}

				const slicedAction = cloneAction(action);
				slicedAction[statePathMetaKey] = path.slice(1);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return reducer(state, slicedAction);
			}
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return reducer(state, action);
	};

	if (reducer.name) {
		Object.defineProperty(filteredReducer, "name", {
			value: reducer.name + "__filtered-by-path",
		});
	}

	return filteredReducer;
}

export default createFilteredReducerForPath;
