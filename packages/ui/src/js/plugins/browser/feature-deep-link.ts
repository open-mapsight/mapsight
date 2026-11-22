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
import {
	applyFeatureSourceReveal,
	parseFeatureSourceSearchParam,
} from "../common/reveal-feature-source";

const defaultFeatureSelectionsController = c.FEATURE_SELECTIONS;
const defaultFeatureSelection = FEATURE_SELECTION_SELECT;
const defaultGetParameter = "feature";
const selectPrimaryFeature = createFeatureSelectionSelector(
	defaultFeatureSelectionsController,
	defaultFeatureSelection,
);

let isAddressOnlyHistoryWrite = false;

/** Run a synchronous permalink write with feature navigation suppressed. */
export function withAddressOnlyHistoryWrite(write: () => void) {
	const previous = isAddressOnlyHistoryWrite;
	isAddressOnlyHistoryWrite = true;
	try {
		write();
	} finally {
		isAddressOnlyHistoryWrite = previous;
	}
}

function getHistoryFeatureId(
	state: unknown,
	key: string,
): FeatureId | null | undefined {
	if (
		typeof state !== "object" ||
		state === null ||
		!Object.hasOwn(state, key)
	) {
		return undefined;
	}
	const featureId = (state as Record<string, unknown>)[key];
	return featureId === null || (typeof featureId === "string" && featureId)
		? featureId
		: undefined;
}

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
 * history state changes from the app. Browser history traversal emits popstate.
 *
 * @param fn function name to patch (e.g. "pushState" or "replaceState")
 * @param callback will get called _after_ that function has been called
 */
function patchWindowHistoryFunction(
	fn: "pushState" | "replaceState",
	callback: (state: unknown) => void,
) {
	const history = window.history;
	// eslint-disable-next-line @typescript-eslint/unbound-method -- Call with the history receiver and restore the original method on teardown.
	const originalFn = history[fn];
	let active = true;
	const patched: History[typeof fn] = (state: unknown, ...rest) => {
		originalFn.call(history, state, ...rest);
		if (active) {
			callback(state);
		}
	};
	history[fn] = patched;
	return () => {
		active = false;
		if (history[fn] === patched) {
			history[fn] = originalFn;
		}
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
 *                                            has been selected, defaults to the configured getParameter plus "src" and "cHash". Pass false to disable.
 * @param [options.clearMissingParameters] clear if getParameter and the given
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
): PluginInstance & {destroy(): void} {
	const {
		featureSelectionsController = defaultFeatureSelectionsController,
		featureSelection = defaultFeatureSelection,
		getParameter = defaultGetParameter,
		autoRemoveParameters = [getParameter, "src", "cHash"],
		setMapOnlyViewInMobile = true,
		clearMissingParameters = null,
	} = options;
	const historyKey =
		featureSelectionsController === defaultFeatureSelectionsController &&
		featureSelection === defaultFeatureSelection
			? "featureId"
			: `mapsightFeatureSelection:${JSON.stringify([featureSelectionsController, featureSelection])}`;
	const selectorSelectedFeatures = createFeatureSelectionSelector(
		featureSelectionsController,
		featureSelection,
	);

	let isHandled = false;
	const cleanups: Array<() => void> = [];
	return {
		destroy() {
			isHandled = true;
			for (const cleanup of cleanups.splice(0).reverse()) {
				cleanup();
			}
		},
		afterRender: function handleFeatureDeepLink(context) {
			if (isHandled) {
				return;
			}

			isHandled = true;

			const {store} = context;
			if (!store) {
				return;
			}
			let activeQuery:
				| {
						featureId: FeatureId;
						sourceId: string | null;
						stop: () => void;
				  }
				| undefined;

			function stopWatchingFeature() {
				const previous = activeQuery;
				activeQuery = undefined;
				previous?.stop();
			}

			const handleFeatureNavigation = (
				id: FeatureId | null | undefined,
			) => {
				if (id === null) {
					store.dispatch(
						deselectAll(
							featureSelectionsController,
							featureSelection,
						),
					);
				} else if (id !== undefined) {
					selectFeature(
						store,
						featureSelectionsController,
						featureSelection,
						id,
						setMapOnlyViewInMobile,
					);
				}
			};

			const readQueryFeature = () =>
				getQueryStringParameter(window.location.search, getParameter);

			const watchLinkedFeature = (
				featureId: FeatureId,
				sourceId: string | null,
			) => {
				const cancelReveal = applyFeatureSourceReveal(store, {
					featureId,
					sourceId,
				});
				const cancelSelectionWatch = observeStateOnce(
					store,
					selectorSelectedFeatures,
					(selection) => {
						stopWatchingFeature();
						if (
							!autoRemoveParameters ||
							readQueryFeature() !== featureId
						) {
							return;
						}
						const url = new URL(window.location.href);
						let search = url.search;
						for (const key of autoRemoveParameters) {
							search = removeQueryStringParameter(search, key);
						}
						if (search === url.search) return;
						url.search = search;
						const features = selection?.features ?? [];
						const previous: unknown = window.history.state;
						const state =
							previous && typeof previous === "object"
								? previous
								: {};
						const selectedId =
							features.length < 2
								? (features[0] ?? null)
								: undefined;
						const entryState = {...state, [historyKey]: selectedId};
						if (historyKey !== "featureId") {
							// Capture the open details panel independently of preselection.
							entryState.featureId =
								selectPrimaryFeature(store.getState())
									?.features[0] ?? null;
						}
						withAddressOnlyHistoryWrite(() => {
							window.history.pushState(entryState, "", url);
						});
					},
				);
				activeQuery = {
					featureId,
					sourceId,
					stop() {
						cancelSelectionWatch();
						cancelReveal();
					},
				};
			};

			const followEntry = (state: unknown) => {
				stopWatchingFeature();
				const featureId = readQueryFeature();
				const id = featureId ?? getHistoryFeatureId(state, historyKey);
				if (
					id === undefined &&
					clearMissingParameters &&
					!clearMissingParameters.some((key) =>
						getQueryStringParameter(window.location.search, key),
					)
				) {
					handleFeatureNavigation(null);
				} else {
					handleFeatureNavigation(id);
				}
				if (featureId) {
					watchLinkedFeature(
						featureId,
						parseFeatureSourceSearchParam(window.location.search),
					);
				}
			};

			const followHistoryMethod = (state: unknown, replace: boolean) => {
				if (isAddressOnlyHistoryWrite) return;
				const id = getHistoryFeatureId(state, historyKey);
				const featureId = readQueryFeature();
				const sourceId = parseFeatureSourceSearchParam(
					window.location.search,
				);
				const sameQuery =
					activeQuery?.featureId === featureId &&
					activeQuery?.sourceId === sourceId;
				if (id === undefined) {
					if (!sameQuery) stopWatchingFeature();
					return;
				}
				const selected = selectorSelectedFeatures(
					store.getState(),
				)?.features;
				if (
					replace &&
					selected?.length === 1 &&
					selected[0] === id &&
					sameQuery
				) {
					return;
				}
				stopWatchingFeature();
				if (!replace || selected?.length !== 1 || selected[0] !== id) {
					handleFeatureNavigation(id);
				}
				if (featureId && featureId === id) {
					watchLinkedFeature(featureId, sourceId);
				}
			};

			followEntry(window.history.state);
			const onPopState = (event: PopStateEvent) => {
				if (!isAddressOnlyHistoryWrite) followEntry(event.state);
			};
			window.addEventListener("popstate", onPopState);
			cleanups.push(
				stopWatchingFeature,
				patchWindowHistoryFunction("pushState", (state) =>
					followHistoryMethod(state, false),
				),
				patchWindowHistoryFunction("replaceState", (state) =>
					followHistoryMethod(state, true),
				),
				() => window.removeEventListener("popstate", onPopState),
			);
		},
	};
}
