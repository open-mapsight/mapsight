import type {Store} from "@reduxjs/toolkit";

import {
	deselectAll,
	selectExclusively,
} from "@mapsight/core/lib/feature-selections/actions";
import {createFeatureSelectionSelector} from "@mapsight/core/lib/feature-selections/selectors";
import type {FeatureId} from "@mapsight/core/types";

import getQueryStringParameter from "@mapsight/lib-js/string/get-query-string-parameter";
import removeQueryStringParameter from "@mapsight/lib-js/string/remove-query-string-parameter";
import {observeStateOnce} from "@mapsight/lib-redux/observe-state";

import {VIEW_MAP_ONLY} from "../../config/constants/app";
import * as c from "../../config/constants/controllers";
import {FEATURE_SELECTION_SELECT} from "../../config/feature/selections";
import {setView} from "../../store/actions";
import type {RootStateSlice} from "../../store/selectors";
import {isViewMobile, viewSelector} from "../../store/selectors";
import type {PluginInstance} from "../../types";

const defaultFeatureSelectionsController = c.FEATURE_SELECTIONS;
const defaultFeatureSelection = FEATURE_SELECTION_SELECT;
const defaultGetParameter = "feature";
const defaultAutoRemoveParameters = [defaultGetParameter, "cHash"];

function selectFeature(
	store: Store,
	featureSelectionsController: string,
	featureSelection: string,
	featureId: FeatureId,
	setMapOnlyViewInMobile: boolean,
) {
	store.dispatch(
		selectExclusively(
			featureSelectionsController,
			featureSelection,
			featureId,
		),
	);

	if (
		setMapOnlyViewInMobile &&
		isViewMobile(viewSelector(store.getState() as RootStateSlice))
	) {
		store.dispatch(setView(VIEW_MAP_ONLY));
	}
}

/**
 * Hooks into global window.history[fn] to react to
 * history state changes from the app (as opposed to `window.onpopstate` which
 * triggers when a browser ui actions causes a history state change).
 *
 * @param fn function name to patch (e.g. "pushState" or "replaceState")
 * @param callback will get called _after_ that function has been called
 */
function patchWindowHistoryFunction(
	fn: "pushState" | "replaceState",
	callback: (state: unknown) => void,
) {
	const originalFn = window.history[fn];

	window.history[fn] = (state, ...rest) => {
		const returnValue: unknown = originalFn.apply(window.history, [
			state,
			...rest,
		]);
		callback(state);
		return returnValue;
	};
}

/**
 * This plugin will select the feature identified by the defined get parameter and optionally remove parameters from the
 * window.location using the history API.
 *
 * @param [options] options
 * @param [options.featureSelectionsController] name of the feature selections controller, defaults to mapsight ui default
 * @param [options.featureSelection="select"] name of the feature selection to track
 * @param [options.getParameter="feature"] name get parameter identifying the feature
 * @param [options.setMapOnlyViewInMobile=true] will set MapOnly view on mobile if a feature has been linked
 * @param [options.autoRemoveParameters] list of get parameters to remove once the feature
 *                                            has been selected, defaults to ["feature", "cHash"]. Pass false to disable.
 * @param [options.clearMissingParameters] if set to true or an array clear if getParameter and the mentioned
 *                                            parameters are missing. don't clear if getParameter is missing, but one of the
 *                                            mentioned parameters is there. we keep this to be safe in race condition
 *                                            where ?feature is set but ?preselect is not where we want to keep the implicit
 *                                            preselect of the feature parameter
 *
 * @returns plugin instance
 */
export default function createPlugin(
	options: {
		featureSelectionsController?: string;
		featureSelection?: string;
		getParameter?: string;
		setMapOnlyViewInMobile?: boolean;
		autoRemoveParameters?: string[] | false;
		clearMissingParameters?: string[] | false;
	} = {},
): PluginInstance {
	const {
		featureSelectionsController = defaultFeatureSelectionsController,
		featureSelection = defaultFeatureSelection,
		getParameter = defaultGetParameter,
		autoRemoveParameters = defaultAutoRemoveParameters,
		setMapOnlyViewInMobile = true,
		clearMissingParameters = null,
	} = options;
	const selectorSelectedFeatures = createFeatureSelectionSelector(
		featureSelectionsController,
		featureSelection,
	);

	let isHandled = false;
	return {
		afterRender: function handleFeatureDeepLink(context) {
			if (isHandled) {
				return;
			}

			isHandled = true;

			const {store} = context;
			if (!store) {
				return;
			}

			// We always do this action even if we should already have done that
			// by re-hydrating the state as it may not have had the dynamic get parameter passed along
			const featureId = getQueryStringParameter(
				window.location.search,
				getParameter,
			);
			if (featureId) {
				selectFeature(
					store,
					featureSelectionsController,
					featureSelection,
					featureId,
					setMapOnlyViewInMobile,
				);

				if (autoRemoveParameters && autoRemoveParameters.length) {
					// if we can, remove initial feature id from url
					// when the selection changes (e.g. panel is closed/different feature is selected)
					observeStateOnce(store, selectorSelectedFeatures, () => {
						let newUrl = window.location.href;
						autoRemoveParameters.forEach((key) => {
							newUrl = removeQueryStringParameter(newUrl, key);
						});
						window.history.pushState(
							null,
							window.document.title,
							newUrl,
						);
					});
				}
			} else {
				if (clearMissingParameters) {
					let found: string | null = null;
					while (!found && clearMissingParameters[0]) {
						found = getQueryStringParameter(
							window.location.search,
							clearMissingParameters.shift() as string,
						);
					}
					if (!found) {
						store.dispatch(
							deselectAll(
								featureSelectionsController,
								featureSelection,
							),
						);
					}
				}
				// handle select via state at relaod
				if (
					window.history.state &&
					"featureId" in window.history.state &&
					window.history.state.featureId
				) {
					selectFeature(
						store,
						featureSelectionsController,
						featureSelection,
						window.history.state.featureId,
						setMapOnlyViewInMobile,
					);
				}
			}

			const handleHistoryStateChange = (state) => {
				if (state && "featureId" in state) {
					if (state.featureId) {
						selectFeature(
							store,
							featureSelectionsController,
							featureSelection,
							state.featureId,
							setMapOnlyViewInMobile,
						);
					} else if (state?.featureId === null) {
						// test for null to inhibit action if featureId is simply omitted
						store.dispatch(
							deselectAll(
								featureSelectionsController,
								featureSelection,
							),
						);
					}
				}
			};

			patchWindowHistoryFunction("pushState", handleHistoryStateChange);
			patchWindowHistoryFunction(
				"replaceState",
				handleHistoryStateChange,
			);
		},
	};
}
