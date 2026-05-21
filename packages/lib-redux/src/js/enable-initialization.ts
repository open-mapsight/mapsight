import type {AnyAction, Reducer} from "@reduxjs/toolkit";

/**
 * Add initialization reducer to existing reducer
 *
 * @deprecated Use redux preloadedState or mergeAll actions instead.
 *
 * @param reducer base reducer to enhance
 * @param [actionName] name of action, default: 'INITIALIZE'
 * @returns enhanced reducer
 */

export default function enableInitialization(
	reducer: Reducer,
	actionName = "INITIALIZE",
) {
	const aReducerWithInitialization: Reducer = <T>(
		state: T,
		action: AnyAction,
	) => {
		if (action.type === actionName) {
			return action.value as T;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return reducer(state, action);
	};

	if (reducer.name) {
		Object.defineProperty(aReducerWithInitialization, "name", {
			value: reducer.name + "__with-initialization",
		});
	}

	return aReducerWithInitialization;
}
