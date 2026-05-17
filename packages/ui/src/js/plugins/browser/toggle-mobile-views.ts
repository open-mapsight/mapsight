import {MapController} from "@mapsight/core/lib/map/controller";

import {VIEW_MAP_ONLY, VIEW_MOBILE} from "../../config/constants/app";
import * as c from "../../config/constants/controllers";
import {setView} from "../../store/actions";
import {isEmbeddedMapSelector, viewSelector} from "../../store/selectors";
import type {PluginInstance} from "../../types.ts";

const defaultMapControllerName = c.MAP;
const defaultToggleBrowserEvent = "click";

/**
 * This plugin will bind the search result feature source to the mapsight ui state
 *
 * @param [options] options
 * @param [options.mapControllerName="map"] name of the map controller, defaults to mapsight ui default
 * @param [options.toggleBrowserEvent="click"] event which should trigger a toggle
 * @returns plugin instance
 */
export default function createPlugin(
	options: {
		mapControllerName?: string;
		toggleBrowserEvent?: string;
	} = {},
): PluginInstance {
	const {
		mapControllerName = defaultMapControllerName,
		toggleBrowserEvent = defaultToggleBrowserEvent,
	} = options;

	if (typeof window === "undefined") {
		console.error("This plugin will only work as intended in the browser!");
	}

	return {
		afterCreate: function viewsCreatePlugin(context) {
			const {store, controllers} = context;
			if (!store || !controllers) return;

			const mapController = controllers[mapControllerName];
			if (mapController && mapController instanceof MapController) {
				mapController
					.getMap()
					?.getTargetElement()
					?.addEventListener(
						toggleBrowserEvent,
						function handleToggleInteraction() {
							const state = store.getState();
							if (
								viewSelector(state) === VIEW_MOBILE &&
								!isEmbeddedMapSelector(state)
							) {
								store.dispatch(setView(VIEW_MAP_ONLY));
							}
						},
					);
			}
		},
	};
}
