import {FeatureSourcesController} from "@mapsight/core/lib/feature-sources/controller";

import * as c from "../../config/constants/controllers";
import {searchResultSelectionFeatureSourceSelector} from "../../store/selectors";
import type {PluginInstance} from "../../types.ts";

const defaultFeatureSourceId = "searchResult";
const defaultFeatureSourcesControllerName = c.FEATURE_SOURCES;

/**
 * This plugin will bind the search result feature source to the mapsight ui state
 *
 * @param [options] options
 * @param [options.featureSourceId] name of the feature source, default = "searchResult"
 * @param [options.featureSourcesControllerName] name of the feature sources controller, defaults to mapsight ui default
 * @returns plugin instance
 */
export default function createPlugin(
	options: {
		featureSourceId?: string;
		featureSourcesControllerName?: string;
	} = {},
): PluginInstance {
	const {
		featureSourceId = defaultFeatureSourceId,
		featureSourcesControllerName = defaultFeatureSourcesControllerName,
	} = options;

	return {
		afterCreate: function searchPlugin(context) {
			const controller =
				context.controllers?.[featureSourcesControllerName];

			if (controller && controller instanceof FeatureSourcesController) {
				controller.bindFeatureSourceToStore(
					featureSourceId,
					searchResultSelectionFeatureSourceSelector,
				);
			}
		},
	};
}
