import get from "lodash/get";
import set from "lodash/set";
import {Store} from "redux";

import {observeState} from "./observe-state";

/**
 * Creates a storage object to access local storage.
 *
 * @param [storageKey=null] key to be used in local storage
 * @returns storage adapter
 */
export function createStorage(storageKey: string | null = null) {
	function setStorageKey(k: string | null) {
		storageKey = k;
	}

	function getLocalStorageState(): unknown {
		if (!storageKey) {
			throw Error(
				"@mapsight/lib-redux: Cannot access local storage without a key. Please set a storage key using the `string: storageKey` property on `createStorage(string?: storageKey)` or using the `setStorageKey(string: storageKey)` method on an existing storage object.",
			);
		}

		if (typeof window !== "undefined") {
			const value = window.localStorage.getItem(storageKey);
			return window.localStorage && value ? JSON.parse(value) : null;
		}

		return null;
	}

	function setLocalStorageState(state: unknown) {
		if (!storageKey) {
			throw Error(
				"@mapsight/lib-redux: Cannot access local storage without a key. Please set a storage key using the `string: storageKey` property on `createStorage(string?: storageKey)` or using the `setStorageKey(string: storageKey)` method on an existing storage object.",
			);
		}

		if (window.localStorage) {
			window.localStorage.setItem(storageKey, JSON.stringify(state));
		}
	}

	function updateLocalStorageState(
		path: Array<string> | string,
		value: unknown,
	) {
		if (!storageKey) {
			throw Error(
				"@mapsight/lib-redux: Cannot access local storage without a key. Please set a storage key using the `string: storageKey` property on `createStorage(string?: storageKey)` or using the `setStorageKey(string: storageKey)` method on an existing storage object.",
			);
		}

		setLocalStorageState(set<any>(getLocalStorageState(), path, value));
	}

	/**
	 * Observes and synchronizes the state of the given store with local storage.
	 *
	 * @see lodash/get for path definition
	 *
	 * @param store the store to observe
	 * @param paths array of path strings (string[]) or path arrays (string[][])
	 */
	function synchronizePathsToLocalStorage(
		store: Store,
		paths: Array<string | Array<string>>,
	) {
		if (!storageKey) {
			throw Error(
				"@mapsight/lib-redux: Cannot access local storage without a key. Please set a storage key using the `string: storageKey` property on `createStorage(string?: storageKey)` or using the `setStorageKey(string: storageKey)` method on an existing storage object.",
			);
		}

		if (window.localStorage) {
			paths.forEach(function synchronizePathToLocalStorage(path) {
				observeState(
					store,
					(state): unknown =>
						// eslint-disable-next-line @typescript-eslint/no-unsafe-call
						get(state, path),
					(value) => updateLocalStorageState(path, value),
				);
			});
		}
	}

	return {
		setStorageKey: setStorageKey,
		getLocalStorageState: getLocalStorageState,
		setLocalStorageState: setLocalStorageState,
		updateLocalStorageState: updateLocalStorageState,
		synchronizePathsToLocalStorage: synchronizePathsToLocalStorage,
	};
}
