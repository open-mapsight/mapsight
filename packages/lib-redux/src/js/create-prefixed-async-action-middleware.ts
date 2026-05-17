/**
 * Creates a redux middleware that allows dispatching of functions as actions, when the action
 * exposes the defined actionFlag. If a prefix is provided, the action function will receive a
 * prefixed getState, meaning it will retrieve the sub store with the prefix key (store.getState()[prefix]).
 *
 * Works similar to thunk, but with additional flag and optional sub store getState.
 *
 * @param [actionFlag] action flag, default: 'isAsync'
 * @param [prefix] prefix state prefix
 * @param [extraArgument] extra argument to be passed to action function
 *
 * @returns {function(*=): function(*): Function} resulting middleware
 */
import {Middleware, MiddlewareAPI} from "redux";

export default function createPrefixedAsyncActionMiddleware<
	Prefix extends string | undefined,
>(
	actionFlag = "isAsync",
	prefix?: Prefix,
	extraArgument: unknown = undefined,
): Middleware {
	return function prefixedAsyncActionMiddleware(api: MiddlewareAPI) {
		// eslint-disable-next-line @typescript-eslint/unbound-method
		let getState = api.getState;
		if (typeof prefix === "string") {
			// eslint-disable-next-line @typescript-eslint/unbound-method
			const baseGetState = api.getState as () => Record<string, unknown>;
			getState = function getStateWithPrefix() {
				return baseGetState()[prefix];
			};
		}

		return function (next) {
			return function prefixedAsyncActionMiddlewareWithAction(action) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				if (typeof action === "function" && action.meta?.[actionFlag]) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
					return action(api.dispatch, getState, extraArgument);
				}

				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return next(action);
			};
		};
	};
}
