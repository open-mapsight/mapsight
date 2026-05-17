import {APP_EVENT_PARTIAL_CONTENT_CHANGED} from "../../components/helping/app-channel";
import type {PluginInstance} from "../../types.ts";

/**
 * This plugin will call the partialChangeHandler (@see {CreateOptions.partialChangeHandler}) when some partial content
 * has changed in the mapsight ui controlled dom, allowing for manipulation of the changed dom (e.g. displaying charts in the
 * feature selection info)
 *
 * @param [_options] options currently not used
 * @returns plugin instance
 */
export default function createPlugin(_options = {}): PluginInstance {
	return {
		afterCreate: function partialContentChangedEventPlugin(context) {
			if (context.createOptions.partialChangeHandler) {
				context.appChannelListeners.push([
					APP_EVENT_PARTIAL_CONTENT_CHANGED,
					context.createOptions.partialChangeHandler,
				]);
			}
		},
	};
}
