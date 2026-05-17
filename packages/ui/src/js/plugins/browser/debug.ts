import type {MapController} from "@mapsight/core/lib/map/controller";
import {getIdForLayer} from "@mapsight/core/lib/map/lib/tagLayer";

import type {PluginInstance} from "../../types";

const defaultGlobalVariableName = "MSUI";

/**
 * This plugin will make debug info available in a global variable.
 */
export default function createPlugin(
	options: {
		globalVariableName?: string;
	} = {},
): PluginInstance {
	const {globalVariableName = defaultGlobalVariableName} = options;

	return {
		afterCreate: (ctx) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			window[globalVariableName] = {
				context: ctx,
				getLayerObjects() {
					const layerMap = {};
					(ctx.controllers?.map as MapController)
						.getMap()
						?.getAllLayers()
						.forEach((l, i) => {
							layerMap[getIdForLayer(l) ?? "unnamed_" + i] = l;
						});
					return layerMap;
				},
			};
		},
	};
}
