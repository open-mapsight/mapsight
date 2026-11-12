import type {PropsWithChildren} from "react";
import {Provider} from "react-redux";

import {type EnhancedStore, configureStore} from "@reduxjs/toolkit";

import {baseReducer} from "@mapsight/core/lib/base/reducer";

import createFilteredReducerForPath from "@mapsight/lib-redux/create-filtered-reducer-for-path";

/**
 * Store with real path-routed reducers for map-like slices, so hook tests can
 * dispatch the actions the hooks create and observe the resulting state.
 */
export function createMapHookStore(
	slices: Record<string, unknown>,
): EnhancedStore<Record<string, unknown>> {
	return configureStore({
		reducer: Object.fromEntries(
			Object.entries(slices).map(([name, initial]) => {
				const reduce = createFilteredReducerForPath(baseReducer, name);
				return [
					name,
					(
						state: unknown = initial,
						action: {type: string},
					): unknown => reduce(state, action),
				];
			}),
		),
		middleware: (getDefault) =>
			getDefault({serializableCheck: false, immutableCheck: false}),
	});
}

export function MapHookProvider({
	store,
	children,
}: PropsWithChildren<{store: ReturnType<typeof createMapHookStore>}>) {
	return <Provider store={store}>{children}</Provider>;
}
