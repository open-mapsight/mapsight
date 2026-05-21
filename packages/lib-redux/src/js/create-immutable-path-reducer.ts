import type {AnyAction, Reducer} from "@reduxjs/toolkit";
import get from "lodash/get";

import deepChangeState from "./deep-change-state";

/**
 * Creates a new reducer, that replaces an value at the given path using the given reducer,
 * replacing all parent objects, instead of mutating the existing object(s).
 *
 * The given reducer has to work immutable as well to get the full desired effect!
 *
 * @param reducer reducer to reduce the value at the path
 * @param [pathKey] path in the object to reduce, default: 'path'
 * @returns resulting immutable path reducer
 */
export default function createImmutablePathReducer(
	reducer: Reducer,
	pathKey = "path",
): Reducer {
	// noinspection UnnecessaryLocalVariableJS
	const immutablePathReducer: Reducer = <T>(
		state: T,
		action: AnyAction,
	): T => {
		const path = action[pathKey] as Array<string>;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const oldValue = (path?.length ? get(state, path) : state) as T;
		const newValue = reducer(oldValue, action) as T;
		if (newValue === oldValue) {
			return state;
		}

		return deepChangeState(state, path, newValue);
	};

	//if (reducer.name) {
	//	Object.defineProperty(aImmutablePathReducer, 'name', {value: reducer.name + '__immutable-path'});
	//}

	return immutablePathReducer;
}
