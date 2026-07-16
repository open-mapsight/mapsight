import {compose} from "@reduxjs/toolkit";

import type {LoadOptions} from "@mapsight/core/lib/feature-sources/actions";
import {
	LOAD_FEATURE_SOURCE_ERROR,
	LOAD_FEATURE_SOURCE_SUCCESS,
	load,
} from "@mapsight/core/lib/feature-sources/actions";

import get from "@mapsight/lib-js/object/getPath";

import {
	FEATURE_LIST,
	FEATURE_SOURCES,
} from "../../config/constants/controllers";
import createActionWatcher from "../../helpers/create-action-watcher";
import type {MapsightUiContext, PluginInstance} from "../../types";

const defaultLoadOptions: LoadOptions = {};
const defaultListControllerName = FEATURE_LIST;

/**
 * This plugin will delay the render until the feature source for the list is loaded
 *
 * @param [options] options
 * @param [options.loadOptions] options passed to the load function (depending on source type)
 * @param [options.listControllerName="list"] list controller name
 * @returns plugin instance
 */
export default function createPlugin(
	options: {
		loadOptions?: LoadOptions;
		listControllerName?: string;
	} = {},
): PluginInstance {
	const {
		loadOptions = defaultLoadOptions,
		listControllerName = defaultListControllerName,
	} = options;

	const actionWatcher = createActionWatcher();

	return {
		afterInit: function renderAwaitListFeatureSourcesLoadedInitPlugin(
			context,
		) {
			// @ts-expect-error TODO
			context.storeEnhancer = context.storeEnhancer
				? compose(context.storeEnhancer, actionWatcher.enhancer)
				: actionWatcher.enhancer;
		},

		beforeRender: function renderAwaitListFeatureSourcesLoadedRenderPlugin(
			context,
		) {
			if (!context.canPluginsDelayRender) {
				return Promise.resolve(undefined);
			}

			return new Promise<void>(function (resolve) {
				let featureSourcesToBeLoaded =
					getFeatureSourcesToBeLoadedFromConfig(
						context.baseMapsightConfig,
						listControllerName,
					);

				if (!featureSourcesToBeLoaded.length) {
					resolve();
					return;
				}

				actionWatcher.handler = (action) => {
					// wait for feature sources to be loaded
					if (
						action.type === LOAD_FEATURE_SOURCE_SUCCESS ||
						action.type === LOAD_FEATURE_SOURCE_ERROR
					) {
						if (featureSourcesToBeLoaded.indexOf(action.id) > -1) {
							featureSourcesToBeLoaded =
								featureSourcesToBeLoaded.filter(
									(f) => f !== action.id,
								);
						}

						if (!featureSourcesToBeLoaded.length) {
							resolve();
						}
					}
				};
				featureSourcesToBeLoaded.forEach((featureSourceId) =>
					context.store?.dispatch(
						load(FEATURE_SOURCES, featureSourceId, loadOptions),
					),
				);
			});
		},
	};
}

function getFeatureSourcesToBeLoadedFromConfig(
	baseMapsightConfig: MapsightUiContext["baseMapsightConfig"],
	listControllerName: string,
) {
	return [
		get(baseMapsightConfig, [listControllerName, "featureSource"]) as
			string | undefined,
	].filter((a): a is string => typeof a === "string");
}
