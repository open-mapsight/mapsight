import {
	onRuntimeIconChange,
	setRuntimeIconMapRenderCallback,
} from "@mapsight/traffic-style/runtime";

import {MapController} from "@mapsight/core/lib/map/controller";

import {MAP} from "../../config/constants/controllers";
import type {PluginInstance} from "../../types";

type MapLike = {render: () => void} | null | undefined;

let unregisterRuntimeIconChangeListener: (() => void) | null = null;

function registerRuntimeIconStyleSupport(getMap: () => MapLike): () => void {
	unregisterRuntimeIconChangeListener?.();

	const renderMap = () => {
		getMap()?.render();
	};

	setRuntimeIconMapRenderCallback(renderMap);

	unregisterRuntimeIconChangeListener = onRuntimeIconChange(renderMap);

	return () => {
		unregisterRuntimeIconChangeListener?.();
		unregisterRuntimeIconChangeListener = null;
		setRuntimeIconMapRenderCallback(null);
	};
}

function isMapController(controller: unknown): controller is MapController & {
	mount(target: HTMLElement): void;
	unmount(): void;
} {
	return (
		controller instanceof MapController &&
		"mount" in controller &&
		typeof controller.mount === "function" &&
		"unmount" in controller &&
		typeof controller.unmount === "function"
	);
}

/**
 * Re-renders the map when async runtime icons finish rasterizing.
 *
 * @param [options] options
 * @param [options.mapControllerName="map"] map controller name
 * @returns plugin instance
 */
export default function createRuntimeIconStylePlugin(
	options: {
		mapControllerName?: string;
	} = {},
): PluginInstance {
	const {mapControllerName = MAP} = options;

	return {
		afterCreate({controllers}) {
			const mapController = controllers?.[mapControllerName];
			if (!isMapController(mapController)) {
				return;
			}

			const originalMount = mapController.mount.bind(mapController);
			const originalUnmount = mapController.unmount.bind(mapController);
			let unregister: (() => void) | null = null;

			mapController.mount = (target: HTMLElement) => {
				originalMount(target);
				unregister?.();
				unregister = registerRuntimeIconStyleSupport(() =>
					mapController.getMap(),
				);
			};

			mapController.unmount = () => {
				unregister?.();
				unregister = null;
				originalUnmount();
			};
		},
	};
}
