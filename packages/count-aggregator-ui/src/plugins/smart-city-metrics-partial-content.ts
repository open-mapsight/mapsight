import {APP_EVENT_PARTIAL_CONTENT_CHANGED} from "@mapsight/ui/components/helping/app-channel";
import type {PluginInstance} from "@mapsight/ui/types";

import {
	type SmartCityMetricsOptions,
	createSmartCityMetricsPartialContentHandler,
} from "../feature-details-metrics/index.js";

export type SmartCityMetricsPartialContentPluginOptions =
	SmartCityMetricsOptions & {
		debounceMs?: number;
	};

function debounceListener(
	listener: EventListener,
	waitMs: number,
): EventListener {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	return function debouncedListener(this: unknown, event: Event) {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			listener.call(this, event);
		}, waitMs);
	};
}

/**
 * Mounts count-aggregator metric widgets when feature detail HTML changes.
 */
export function createSmartCityMetricsPartialContentPlugin(
	options: SmartCityMetricsPartialContentPluginOptions = {},
): PluginInstance {
	const {debounceMs = 200, ...handlerOptions} = options;
	const handler = createSmartCityMetricsPartialContentHandler(handlerOptions);
	const listener =
		debounceMs > 0 ? debounceListener(handler, debounceMs) : handler;

	return {
		afterCreate(context) {
			context.appChannelListeners.push([
				APP_EVENT_PARTIAL_CONTENT_CHANGED,
				listener,
			]);
		},
	};
}
