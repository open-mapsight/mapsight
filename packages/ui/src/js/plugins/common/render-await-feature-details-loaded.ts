import {compose} from "@reduxjs/toolkit";

import type {FeatureSelectionsState} from "@mapsight/core/lib/feature-selections/selectors";
import {LOAD_FEATURE_SOURCE_SUCCESS} from "@mapsight/core/lib/feature-sources/actions";
import {findFeatureInFeatureSourcesById} from "@mapsight/core/lib/feature-sources/selectors";
import type {FeatureSourcesState} from "@mapsight/core/lib/feature-sources/types";

import {
	FEATURE_SELECTIONS,
	FEATURE_SOURCES,
} from "../../config/constants/controllers";
import createActionWatcher from "../../helpers/create-action-watcher";
import getFeatureProperty from "../../helpers/get-feature-property";
import {
	FETCH_TEXT_FAILURE,
	FETCH_TEXT_SUCCESS,
	setFeatureDetailsUrl,
} from "../../store/actions";
import type {
	MapsightUiContext,
	MapsightUiFeature,
	MapsightUiFeatureProperty,
	PluginInstance,
} from "../../types";

const defaultFeatureSelection = "select";
const defaultFeatureSelectionsController = FEATURE_SELECTIONS;
const defaultFeaturePropertyDetailsUrl = "detailsUrl";

/**
 * This plugin will delay the render until the details of the feature has been loaded
 *
 * @param [options] options
 * @param [options.featureSelectionsController] name of the feature selections controller, defaults to mapsight ui default
 * @param [options.featureSelection="select"] name of the feature selection to track
 * @param [options.featurePropertyDetailsUrl="detailsUrl"] feature property to get the details url from
 * @returns plugin instance
 */
export default function createFeatureDetailsLoadedPlugin(
	options: {
		featureSelection?: string;
		featureSelectionsController?: string;
		featurePropertyDetailsUrl?: MapsightUiFeatureProperty;
	} = {},
): PluginInstance {
	const {
		featureSelection = defaultFeatureSelection,
		featureSelectionsController = defaultFeatureSelectionsController,
		featurePropertyDetailsUrl = defaultFeaturePropertyDetailsUrl,
	} = options;

	const actionWatcherSources = createActionWatcher();
	const actionWatcherDetails = createActionWatcher();

	return {
		afterInit: function runAwaitFeatureDetailsLoadedInitPlugin(context) {
			// @ts-expect-error TODO
			context.storeEnhancer = context.storeEnhancer
				? compose(
						context.storeEnhancer,
						actionWatcherSources.enhancer,
						actionWatcherDetails.enhancer,
					)
				: compose(
						actionWatcherSources.enhancer,
						actionWatcherDetails.enhancer,
					);
		},

		beforeRender: function runAwaitFeatureDetailsLoadedRenderPlugin(
			context,
		) {
			if (!context.canPluginsDelayRender) {
				return Promise.resolve(undefined);
			}

			const featureId = getSelectedFeatureIdFromConfig(
				context.baseMapsightConfig,
				featureSelection,
				featureSelectionsController,
			);

			return new Promise<void>(function (resolve) {
				if (!featureId) {
					resolve();
					return;
				}

				function checkSources() {
					if (!featureId) return;
					if (!context.store) return;

					const feature = findFeatureInFeatureSourcesById(
						context.store.getState()[
							FEATURE_SOURCES
						] as FeatureSourcesState,
						featureId,
					);
					if (!feature) {
						return;
					}

					const detailsUrl = getFeatureProperty(
						feature as MapsightUiFeature,
						featurePropertyDetailsUrl,
					);
					if (!detailsUrl) {
						// no need to wait, because we do not have a details url to load
						resolve();
						return;
					}

					actionWatcherDetails.handler = (action) => {
						if (
							action.type === FETCH_TEXT_SUCCESS ||
							action.type === FETCH_TEXT_FAILURE
						) {
							resolve();
							actionWatcherDetails.handler = null;
						}
					};
					context.store.dispatch(
						setFeatureDetailsUrl(
							getFeatureProperty(
								feature as MapsightUiFeature,
								featurePropertyDetailsUrl,
							) as string,
						),
					);
				}

				checkSources();

				actionWatcherSources.handler = (action) => {
					// wait for feature sources to be loaded
					if (action.type === LOAD_FEATURE_SOURCE_SUCCESS) {
						checkSources();
					}
				};
			});
		},
	};
}

function getSelectedFeatureIdFromConfig(
	baseMapsightConfig: MapsightUiContext["baseMapsightConfig"],
	featureSelection: string,
	featureSelectionsControllerName: string,
) {
	const baseState = baseMapsightConfig[
		featureSelectionsControllerName
	] as FeatureSelectionsState;
	return baseState[featureSelection]?.features[0];
}
