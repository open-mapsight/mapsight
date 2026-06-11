import {viewSelector} from "@mapsight/ui/store/selectors";
import type {MapsightUiView, PluginInstance} from "@mapsight/ui/types";

import {observeState} from "@mapsight/lib-redux/observe-state";

/**
 * This plugin will request native fullscreen when entering one of the
 * specified views.
 */
export default function createNativeFullscreenPlugin(
	options: {
		elementSelector?: string;
		views?: MapsightUiView[];
		checkInitially?: boolean;
	} = {},
): PluginInstance {
	if (typeof window === "undefined") {
		throw new Error(
			"Native fullscreen plugin requires a browser environment",
		);
	}

	const {
		elementSelector = ".ms3-wrapper",
		views = ["fullscreen"],
		checkInitially = true,
	} = options;

	let reqFS;
	let exitFS;
	let fSElement;
	if ("requestFullscreen" in document.documentElement) {
		reqFS = "requestFullscreen" as const;
		exitFS = "exitFullscreen" as const;
		fSElement = "fullscreenElement" as const;
	} else if ("webkitRequestFullscreen" in document.documentElement) {
		reqFS = "webkitRequestFullscreen" as "requestFullscreen";
		exitFS = "webkitExitFullscreen" as "exitFullscreen";
		fSElement = "webkitFullscreenElement" as "fullscreenElement";
	} else {
		return {}; // nothing to do
	}

	const handleState = (view: MapsightUiView) => {
		const element = document.querySelector(elementSelector);
		if (!element) {
			return;
		}

		const elementIsFullscreen = element === document[fSElement]!;
		const viewIsFullscreen = views.includes(view);

		if (elementIsFullscreen !== viewIsFullscreen) {
			console.log(viewIsFullscreen ? reqFS : exitFS);
			if (viewIsFullscreen) {
				(element[reqFS] as () => void)();
			} else {
				(document[exitFS] as () => void)();
			}
		}
	};

	return {
		afterCreate: function nativeFullscreenPlugin({store}) {
			if (!store) return;

			if (checkInitially) {
				handleState(viewSelector(store.getState()));
			}

			observeState(store, viewSelector, handleState);
		},
	};
}
