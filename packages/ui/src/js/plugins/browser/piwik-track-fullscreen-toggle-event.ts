import {trackEvent} from "@mapsight/lib-js/misc/piwik";
import {observeState} from "@mapsight/lib-redux/observe-state";

import {isFullscreenSelector} from "../../store/selectors";
import type {PluginInstance} from "../../types";

const defaultCategory = "Mapsight";
const defaultActionEnabled = "FullscreenEnabled";
const defaultActionDisabled = "FullscreenDisabled";

/**
 * This plugin will track piwik actions when the fullscreen mode is en-/disabled.
 *
 * @see `@mapsight/lib-js/misc/piwik`
 *
 * @param [options] options
 * @param [options.category="Mapsight"] piwik category to track
 * @param [options.actionEnabled="FullscreenEnabled"]  piwik action to track when enabling fullscreen
 * @param [options.actionDisabled="FullscreenDisabled"]  piwik action to track when disabling fullscreen
 * @returns plugin instance
 */
export default function createPlugin(
	options: {
		category?: string;
		actionEnabled?: string;
		actionDisabled?: string;
	} = {},
): PluginInstance {
	const {
		category = defaultCategory,
		actionEnabled = defaultActionEnabled,
		actionDisabled = defaultActionDisabled,
	} = options;

	return {
		afterCreate: function piwikTrackFullscreenToggleEvent(context) {
			const {store} = context;
			if (!store) return;

			// track fullscreen toggles
			observeState(store, isFullscreenSelector, (newValue) =>
				trackEvent(category, newValue ? actionEnabled : actionDisabled),
			);
		},
	};
}
