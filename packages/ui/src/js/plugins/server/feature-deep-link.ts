import {selectExclusively} from "@mapsight/core/lib/feature-selections/actions";

import getQueryStringParameter from "@mapsight/lib-js/string/get-query-string-parameter";

import * as c from "../../config/constants/controllers";
import {FEATURE_SELECTION_SELECT} from "../../config/feature/selections";
import type {
	ExternalMapsightUiRendererProps,
	PluginInstance,
} from "../../types";

const defaultFeatureSelectionsController = c.FEATURE_SELECTIONS;
const defaultFeatureSelection = FEATURE_SELECTION_SELECT;
const defaultGetParameter = "feature";
const defaultRendererPropName = "requestUrlSearch";

/**
 * This plugin will select the feature identified by the defined get parameter and optionally remove parameters from the
 * window.location using the history API.
 *
 * @param {object} [options] options
 * @param {string} [options.rendererPropName="requestUrlSearch"] request url search property name passed to the renderer
 * @param {string} [options.featureSelectionsController] name of the feature selections controller, defaults to mapsight ui default
 * @param {string} [options.featureSelection="select"] name of the feature selection to track
 * @param {string[] | boolean} [options.autoRemoveParameters] list of get parameters to remove once the feature
 *                                            has been selected, defaults to ["feature", "cHash"]. Pass false to disable.
 * @returns {import('../../types').PluginInstance} plugin instance
 */
export default function createPlugin(
	options: {
		featureSelectionsController?: string;
		featureSelection?: string;
		getParameter?: string;
		rendererPropName?: keyof ExternalMapsightUiRendererProps;
		autoRemoveParameters?: string[] | false;
	} = {},
): PluginInstance {
	const {
		featureSelectionsController = defaultFeatureSelectionsController,
		featureSelection = defaultFeatureSelection,
		getParameter = defaultGetParameter,
		rendererPropName = defaultRendererPropName,
	} = options;

	return {
		beforeRender: function handleFeatureDeepLink(context) {
			const {store, rendererProps} = context;

			if (!store) return;
			if (!rendererProps?.[rendererPropName]) return;

			const featureId = getQueryStringParameter(
				rendererProps[rendererPropName],
				getParameter,
			);
			if (featureId != null) {
				store.dispatch(
					selectExclusively(
						featureSelectionsController,
						featureSelection,
						featureId,
					),
				);
			}
		},
	};
}
