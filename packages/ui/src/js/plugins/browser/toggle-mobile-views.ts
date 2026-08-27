import {unByKey} from "ol/Observable";
import type {EventsKey} from "ol/events";

import {MapController} from "@mapsight/core/lib/map/controller";

import {VIEW_MAP_ONLY, VIEW_MOBILE} from "../../config/constants/app";
import * as c from "../../config/constants/controllers";
import {setView} from "../../store/actions";
import {isEmbeddedMapSelector, viewSelector} from "../../store/selectors";
import type {PluginInstance} from "../../types";

const defaultMapControllerName = c.MAP;
const defaultToggleBrowserEvent = "click";

type ToggleMobileViewsOptions = {
	mapControllerName?: string;
	/**
	 * DOM event on the map target element. Ignored when `useOlSingleClick` is true.
	 * @default "click"
	 */
	toggleBrowserEvent?: string;
	/**
	 * Prefer OpenLayers `singleclick` (ignores drag/pinch). Remount-safe via
	 * mount/unmount wrapping.
	 */
	useOlSingleClick?: boolean;
};

function expandToMapOnlyIfMobile(
	store: NonNullable<
		Parameters<NonNullable<PluginInstance["afterCreate"]>>[0]["store"]
	>,
) {
	const state = store.getState();
	if (viewSelector(state) === VIEW_MOBILE && !isEmbeddedMapSelector(state)) {
		store.dispatch(setView(VIEW_MAP_ONLY));
	}
}

/**
 * Expand default mobile (list below map) to map-only when the user interacts
 * with the map preview.
 *
 * @param [options] options
 * @param [options.mapControllerName="map"] name of the map controller
 * @param [options.toggleBrowserEvent="click"] DOM event on the map target (legacy)
 * @param [options.useOlSingleClick=false] use OL singleclick + remount-safe lifecycle
 * @returns plugin instance
 */
export default function createPlugin(
	options: ToggleMobileViewsOptions = {},
): PluginInstance {
	const {
		mapControllerName = defaultMapControllerName,
		toggleBrowserEvent = defaultToggleBrowserEvent,
		useOlSingleClick = false,
	} = options;

	if (typeof window === "undefined") {
		console.error("This plugin will only work as intended in the browser!");
	}

	return {
		afterCreate: function viewsCreatePlugin(context) {
			const {store, controllers} = context;
			if (!store || !controllers) return;

			const mapController = controllers[mapControllerName];
			if (!(mapController instanceof MapController)) {
				return;
			}

			if (!useOlSingleClick) {
				mapController
					.getMap()
					?.getTargetElement()
					?.addEventListener(
						toggleBrowserEvent,
						function handleToggleInteraction() {
							expandToMapOnlyIfMobile(store);
						},
					);
				return;
			}

			let listenerKey: EventsKey | undefined;

			const detach = () => {
				if (listenerKey) {
					unByKey(listenerKey);
					listenerKey = undefined;
				}
			};

			const attach = () => {
				const map = mapController.getMap();
				if (!map) {
					return;
				}

				detach();
				listenerKey = map.on("singleclick", () => {
					expandToMapOnlyIfMobile(store);
				});
			};

			attach();

			const originalMount = mapController.mount.bind(mapController);
			const originalUnmount = mapController.unmount.bind(mapController);

			mapController.mount = (target: HTMLElement) => {
				originalMount(target);
				attach();
			};

			mapController.unmount = () => {
				detach();
				originalUnmount();
			};
		},
	};
}
