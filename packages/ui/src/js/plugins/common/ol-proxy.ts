import type {Definition} from "@mapsight/core/ol-proxy";
import {di} from "@mapsight/core/ol-proxy";
import GeoJSONFormat from "@mapsight/core/ol-proxy/definitions/format/GeoJSONFormat";
import DoubleClickZoomInteraction from "@mapsight/core/ol-proxy/definitions/interaction/DoubleClickZoomInteraction";
import DragPanInteraction from "@mapsight/core/ol-proxy/definitions/interaction/DragPanInteraction";
import KeyboardPanInteraction from "@mapsight/core/ol-proxy/definitions/interaction/KeyboardPanInteraction";
import KeyboardZoomInteraction from "@mapsight/core/ol-proxy/definitions/interaction/KeyboardZoomInteraction";
import MouseWheelZoomInteraction from "@mapsight/core/ol-proxy/definitions/interaction/MouseWheelZoomInteraction";
import PinchZoomInteraction from "@mapsight/core/ol-proxy/definitions/interaction/PinchZoomInteraction";
import SelectInteraction from "@mapsight/core/ol-proxy/definitions/interaction/SelectInteraction";
import TileLayer from "@mapsight/core/ol-proxy/definitions/layer/TileLayer";
import VectorLayer from "@mapsight/core/ol-proxy/definitions/layer/VectorLayer";
import VectorOverlayLayer from "@mapsight/core/ol-proxy/definitions/layer/VectorOverlayLayer";
import OSMSource from "@mapsight/core/ol-proxy/definitions/source/OsmSource";
import TileWMSSource from "@mapsight/core/ol-proxy/definitions/source/TileWMSSource";
import VectorFeatureSource from "@mapsight/core/ol-proxy/definitions/source/VectorFeatureSource";
import VectorSource from "@mapsight/core/ol-proxy/definitions/source/VectorSource";

import type {PluginInstance} from "../../types.ts";

/**
 * This plugin will inject the ol-proxy dependencies required by default.
 *
 * @param {object} [options] options
 * @param {Array<import('@mapsight/core/ol-proxy').Definition<any>>} [options.dependencies={}] add or override dependencies
 * @returns {import('../../types').PluginInstance} plugin instance
 */
export default function createPlugin({
	dependencies = {},
}: {
	dependencies?: Definition[] | Record<string, Definition>;
} = {}): PluginInstance {
	return {
		afterInit(_context) {
			di.injectDefinitions([
				// layer
				TileLayer,
				VectorLayer,
				VectorOverlayLayer,

				// source
				VectorSource,
				// TODO: Make optional to reduce bundle size
				TileWMSSource,
				OSMSource,
				VectorFeatureSource,

				// format
				GeoJSONFormat,
				// interaction
				SelectInteraction,
				DragPanInteraction,
				DoubleClickZoomInteraction,
				PinchZoomInteraction,
				MouseWheelZoomInteraction,
				KeyboardPanInteraction,
				KeyboardZoomInteraction,
			]);

			if (Array.isArray(dependencies)) {
				di.injectDefinitions(dependencies);
			} else {
				// workaround for legacy code
				di.injectDefinitions(Object.values(dependencies));
			}
		},
	};
}
