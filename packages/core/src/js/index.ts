import type {Config as DevToolsConfig} from "@redux-devtools/extension";
import forEach from "lodash/forEach";
import mapValues from "lodash/mapValues";
import type {Reducer, StoreEnhancer} from "redux";
import {
	applyMiddleware,
	combineReducers,
	compose,
	legacy_createStore as reduxCreateStore,
} from "redux";
import {batchDispatchMiddleware} from "redux-batched-actions";

import {ensureNonNullable, isNonNullable} from "@mapsight/lib-js/nonNullable";
import createFilteredReducerForPath from "@mapsight/lib-redux/create-filtered-reducer-for-path";
import createPrefixedAsyncActionMiddleware from "@mapsight/lib-redux/create-prefixed-async-action-middleware";
import enableAsyncDispatch from "@mapsight/lib-redux/enable-async-dispatch";
import enableControlledDispatchAndObserve from "@mapsight/lib-redux/enable-controlled-dispatch-and-observe";

import {
	ASYNC_ACTION_FLAG,
	CONTROLLED_ACTION_FLAG,
	STATE_PATH_KEY,
} from "@/lib/base/actions";
import type {BaseController} from "@/lib/base/controller";
import defaultPredicate from "@/redux-devtools/defaultPredicate";
import defaultSanitizeAction from "@/redux-devtools/defaultSanitizeAction";
import type {EnhancedStore} from "@/types";

type StoreOptions = {
	/**
	 * redux dev tools options
	 * @see https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md
	 */
	reduxDevToolsOptions?: Partial<DevToolsConfig>;
};

/**
 * Creates an enhanced redux store, which contains all the state of a mapsight application.
 *
 * @param controllers map of controller instances
 * @param appReducers optional map of key => Reducer to add
 * @param preLoadedState optional plain object pre-loaded state to be merged
 * @param appEnhancer optional Enhancer to compose
 * @param options additional options for the store creation, see below:
 * @returns created, enhanced, store
 */
export function createMapsightStore<
	TStore extends EnhancedStore = EnhancedStore,
>(
	controllers: Record<string, BaseController>,
	appReducers: Record<string, Reducer> = {},
	preLoadedState = {},
	appEnhancer: StoreEnhancer | null = null,
	options: StoreOptions = {},
): TStore {
	const {reduxDevToolsOptions = {}} = options;

	// Get reducers from controllers bound to the controller
	const coreReducers = mapValues(controllers, (controller, key) =>
		createFilteredReducerForPath(
			(state, action) => controller.reduce(state, action),
			key,
			STATE_PATH_KEY,
		),
	);

	const reducer = combineReducers({
		...coreReducers,
		...appReducers,
	});

	const coreEnhancer = ((createStore) => (baseReducer, preloadedState) => {
		const store = createStore(
			baseReducer,
			preloadedState,
		) as unknown as EnhancedStore;
		enableAsyncDispatch(store, ASYNC_ACTION_FLAG);
		enableControlledDispatchAndObserve(store, CONTROLLED_ACTION_FLAG);
		store.getController = (name) => ensureNonNullable(controllers[name]);

		return store;
	}) as StoreEnhancer;
	const coreMiddlewareEnhancer = applyMiddleware(
		createPrefixedAsyncActionMiddleware(ASYNC_ACTION_FLAG),
		batchDispatchMiddleware,
	);

	const enhancers = [
		coreEnhancer,
		appEnhancer,
		coreMiddlewareEnhancer,
	].filter(isNonNullable);

	let enhancer: StoreEnhancer;

	// Enable redux dev tools
	if (
		typeof window !== "undefined" &&
		window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
	) {
		const devCompose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
			trace: true,
			actionSanitizer: defaultSanitizeAction,
			predicate: defaultPredicate,
			...reduxDevToolsOptions,
		});
		enhancer = devCompose(...enhancers) as StoreEnhancer;
	} else {
		enhancer = compose(...enhancers);
	}

	const store = reduxCreateStore(reducer, preLoadedState, enhancer) as TStore;

	// bind controllers to store
	forEach(controllers, (controller) => controller.bindToStore(store));

	// after all are bound, init each
	forEach(controllers, (controller) => controller.init());

	return store;
}
