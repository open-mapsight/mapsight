import {
	createFeatureSelectionSelector,
	getFilteredFeatures,
} from "@mapsight/core/lib/feature-selections/selectors";

import {trackEvent} from "@mapsight/lib-js/misc/piwik";
import {observeState} from "@mapsight/lib-redux/observe-state";

import * as c from "../../config/constants/controllers";
import {FEATURE_SELECTION_SELECT} from "../../config/feature/selections";
import type {PluginInstance} from "../../types.ts";

const defaultCategory = "Mapsight";
const defaultAction = "SelectedFeature";

const defaultFeatureSelectionsController = c.FEATURE_SELECTIONS;
const defaultFeatureSelection = FEATURE_SELECTION_SELECT;

/**
 * This plugin will track piwik actions when the a feature is selected
 *
 * @see `@mapsight/lib-js/misc/piwik`
 *
 * @param [options] options
 * @param [options.featureSelectionsController] name of the feature selections controller, defaults to mapsight ui default
 * @param [options.featureSelection="select"] name of the feature selection to track
 * @param [options.category="Mapsight"] piwik category to track
 * @param [options.action="SelectedFeature"]  piwik action to track
 * @returns plugin instance
 */
export default function createPlugin(
	options: {
		featureSelectionsController?: string;
		featureSelection?: string;
		category?: string;
		action?: string;
	} = {},
): PluginInstance {
	const {
		featureSelectionsController = defaultFeatureSelectionsController,
		featureSelection = defaultFeatureSelection,
		category = defaultCategory,
		action = defaultAction,
	} = options;

	return {
		afterCreate: function piwikTrackFullscreenToggleEvent(context) {
			const {store} = context;
			if (!store) return;

			observeState(
				store,
				createFeatureSelectionSelector(
					featureSelectionsController,
					featureSelection,
				),
				(selection) => {
					const filteredFeatures = getFilteredFeatures(selection);
					if (!filteredFeatures) return;

					const hasFeatures = !!filteredFeatures.length;

					if (hasFeatures) {
						trackEvent(
							category,
							action,
							featureSelection,
							JSON.stringify(filteredFeatures),
						);
					}
				},
			); // TODO: Check!
		},
	};
}
