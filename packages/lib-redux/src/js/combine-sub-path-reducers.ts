import {AnyAction, Reducer, combineReducers} from "redux";

import cloneAction from "./clone-action";

/**
 * Combines the given reducers, so they only get actions without a path or
 * a path matching the map key.
 *
 * @param reducerMap a map of reducers and their keys representing their part of the store
 * @param pathKey key of the action parameter that contains the path array
 * @returns combined reducer
 */
export default function combineSubPathReducers(
	reducerMap: Record<string, Reducer>,
	pathKey = "path",
) {
	const reducerEntries = Object.entries(reducerMap).map(([name, reducer]) => {
		const wrapperReducer = <T>(state: T, action: AnyAction): any => {
			if (typeof action.meta === "object") {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
				const path = action.meta[pathKey];

				if (Array.isArray(path) && path.length) {
					if (path[0] !== name) {
						return state;
					}

					const controllerAction = cloneAction(action);
					controllerAction[pathKey] = path.slice(1);

					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return reducer(state, controllerAction);
				}
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return reducer(state, action);
		};

		return [name, wrapperReducer] as const;
	});

	return combineReducers(Object.fromEntries(reducerEntries));
}
