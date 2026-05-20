import {createSelector} from "@reduxjs/toolkit";

import {set} from "@mapsight/core/lib/base/actions";
import {FeatureSourcesController} from "@mapsight/core/lib/feature-sources/controller";
import {getGeolocation} from "@mapsight/core/lib/user-geolocation/actions";
import type {UserGeolocationState} from "@mapsight/core/lib/user-geolocation/selectors";
import createUserGeolocationIsEnabledSelector, {
	createUserGeolocationAsFeatureSelector,
	geolocationStatusSelector,
} from "@mapsight/core/lib/user-geolocation/selectors";
import type {State} from "@mapsight/core/types";

import {createStorage} from "@mapsight/lib-redux/local-storage";
import {
	AbortObserving,
	getAndObserveState,
} from "@mapsight/lib-redux/observe-state";

import * as c from "../../config/constants/controllers";
import type {PluginInstance} from "../../types.ts";

const defaultFeatureSourceId = "userGeolocation";
const defaultFeatureSourcesControllerName = c.FEATURE_SOURCES;
const defaultUserGeolocationControllerName = c.USER_GEOLOCATION;

/**
 * This plugin will bind the use geolocation feature source to the use geolocation controller
 *
 * @param [options] options
 * @param [options.featureSourceId="userGeolocation"] name of the feature source
 * @param [options.featureSourcesControllerName] name of the feature sources controller, defaults to mapsight ui default
 * @param [options.userGeolocationControllerName] name of the user geolocation controller, defaults to mapsight ui default
 * @param  [options.storeInLocalStorage] Syncs enabled state with localStorage if true
 * @returns {import('../../types').PluginInstance} plugin instance
 */
export default function createPlugin(
	options: {
		featureSourceId?: string;
		featureSourcesControllerName?: string;
		userGeolocationControllerName?: string;
		storeInLocalStorage?: boolean;
	} = {},
): PluginInstance {
	const {
		featureSourceId = defaultFeatureSourceId,
		featureSourcesControllerName = defaultFeatureSourcesControllerName,
		userGeolocationControllerName = defaultUserGeolocationControllerName,
		storeInLocalStorage = false,
	} = options;

	const featureSelector = createUserGeolocationAsFeatureSelector(
		userGeolocationControllerName,
	);

	if (typeof window === "undefined") {
		console.error("This plugin will only work as intended in the browser!");
	}

	const localStorage = createStorage("ms3-ui/user-geolocation");

	return {
		afterCreate: function searchPlugin(context) {
			const controller =
				context.controllers?.[featureSourcesControllerName];

			if (controller && controller instanceof FeatureSourcesController) {
				controller.bindFeatureSourceToStore(
					featureSourceId,
					featureSelector,
				);
			}
		},
		afterRender: function ({store}) {
			if (!storeInLocalStorage || !store) {
				return;
			}

			const lSState = localStorage.getLocalStorageState();

			if (
				lSState !== null &&
				typeof lSState === "object" &&
				userGeolocationControllerName in lSState &&
				lSState[userGeolocationControllerName] !== null &&
				typeof lSState[userGeolocationControllerName] === "object" &&
				typeof lSState[userGeolocationControllerName].isEnabled ===
					"boolean"
			) {
				store.dispatch(
					set(
						[userGeolocationControllerName, "isEnabled"],
						lSState[userGeolocationControllerName].isEnabled,
					),
				);
			}

			localStorage.synchronizePathsToLocalStorage(store, [
				[userGeolocationControllerName, "isEnabled"],
			]);

			const geoLocIsEnabledSelector =
				createUserGeolocationIsEnabledSelector(
					userGeolocationControllerName,
				);

			const geoLocStatusSelector = createSelector(
				(state: State) =>
					state[
						userGeolocationControllerName
					] as UserGeolocationState,
				geolocationStatusSelector,
			);
			const alreadyRequestedSelector = createSelector(
				geoLocStatusSelector,
				(status) => status === "loading" || status === "error",
			);

			getAndObserveState(
				store,
				createSelector(
					[geoLocIsEnabledSelector, alreadyRequestedSelector],
					(isEnabled, alreadyRequested) => ({
						isEnabled,
						alreadyRequested,
					}),
				),
				({isEnabled, alreadyRequested}) => {
					if (alreadyRequested) {
						return AbortObserving;
					}

					if (isEnabled) {
						store.dispatch(getGeolocation());
						return AbortObserving;
					}

					return undefined;
				},
			);
		},
	};
}
