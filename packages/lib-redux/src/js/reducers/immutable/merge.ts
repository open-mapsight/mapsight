import merge from "lodash/merge";
import {AnyAction, Reducer} from "redux";

const mergeReducer: Reducer = <
	T extends Array<unknown> | Record<string | number | symbol, unknown>,
>(
	state: T,
	action: AnyAction,
): T => {
	const result: T = (Array.isArray(state) ? [] : {}) as T;

	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	merge(result, state, action.value);

	return result;
};

export default mergeReducer;
