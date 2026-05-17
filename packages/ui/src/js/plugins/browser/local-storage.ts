import merge from "lodash/merge";

import type {PathItem} from "@mapsight/core/lib/base/actions";
import {mergeAll} from "@mapsight/core/lib/base/actions";
import type {State} from "@mapsight/core/types";

import pickPaths from "@mapsight/lib-js/object/pickPaths";
import {createStorage} from "@mapsight/lib-redux/local-storage";

import type {PluginInstance} from "../../types.ts";

const defaultLocalStorageKey = "mapsight--v3-ui";
const defaultLocalStoragePaths = [
	//['app', 'isFullscreen'],
	//['app', 'view'],
	["app", "userPreferenceListVisible"],
];

/**
 * This plugin will synchronize some paths of the store with the browser's local storage and restored on initialization.
 * See {CreateOptions.localStorageKey} and {CreateOptions.localStoragePaths} for configuration.
 *
 * @param [options] options
 * @param [options.localStorageKey="mapsight--v3-ui"] storage key
 * @param [options.localStoragePaths] paths to store
 * @returns plugin instance
 */
export default function createPlugin({
	localStorageKey = defaultLocalStorageKey,
	localStoragePaths = defaultLocalStoragePaths,
} = {}): PluginInstance {
	if (typeof window === "undefined") {
		console.error("This plugin will only work as intended in the browser!");
	}

	let restoredState: Partial<State>;
	let isRestored = false;
	let storage: ReturnType<typeof createStorage>;

	return {
		afterInit: function localStorageInitPlugin({
			initialState,
			isStateReHydrated,
		}) {
			storage = createStorage(localStorageKey);

			// override initial state from local storage
			const savedState = storage.getLocalStorageState();
			restoredState = pickPaths(savedState, localStoragePaths);

			// We cannot change the state before we have not at least rendered the
			// dehydrated html at least once to prevent a mixed up DOM when server-side
			// state and client-side determined state mismatch or has changed
			// since page load. If the app is not re-hydrated but initially rendered
			// in the client we can omit the additional render and set the restored
			// state on creation (before render).
			if (!isStateReHydrated) {
				isRestored = true;
				merge(initialState, restoredState);
			}
		},
		afterCreate: function localStorageCreatePlugin({store}) {
			// sync local storage
			if (store && localStoragePaths) {
				storage.synchronizePathsToLocalStorage(
					store,
					localStoragePaths,
				);
			}
		},
		afterRender: function localStorageAfterRenderPlugin({store}) {
			if (store && !isRestored) {
				store.dispatch(
					mergeAll(restoredState as Record<PathItem, unknown>),
				);
			}
		},
	};
}
