import {observeState} from "@mapsight/lib-redux/observe-state";

import type {View} from "../../config/constants/app";
import {viewSelector} from "../../store/selectors";
import type {PluginInstance} from "../../types";

/**
 * This plugin will request native fullscreen when entering one of the
 * specified views.
 *
 * @param [options] options
 * @param [options.views=['fullscreen']] views to enable native fullscreen on
 * @param [options.checkInitially=true] if set the view will be checked on init and depending on the specified list may request native fullscreen
 * @returns plugin
 */
export default function createNativeFullscreenPlugin(
	options: {
		elementSelector?: string;
		views?: View[];
		checkInitially?: boolean;
	} = {},
): PluginInstance {
	if (typeof window === "undefined") {
		throw new Error(
			"Cannot use native fullscreen plugin outside of browser!",
		);
	}

	const {
		elementSelector = ".ms3-wrapper",
		views = ["fullscreen"],
		checkInitially = true,
	} = options;

	let reqFS: string;
	let exitFS: string;
	let fSElement: string;
	if ("requestFullscreen" in document.documentElement) {
		reqFS = "requestFullscreen";
		exitFS = "exitFullscreen";
		fSElement = "fullscreenElement";
	} else if ("webkitRequestFullscreen" in document.documentElement) {
		reqFS = "webkitRequestFullscreen";
		exitFS = "webkitExitFullscreen";
		fSElement = "webkitFullscreenElement";
	} else {
		return {}; // nothing to do
	}

	const handleState = (view) => {
		const element = document.querySelector(elementSelector);
		if (!element) {
			return;
		}

		const elementIsFullscreen = document[fSElement]
			? element === document[fSElement]
			: false;
		const viewIsFullscreen = views.includes(view);

		if (elementIsFullscreen !== viewIsFullscreen) {
			if (viewIsFullscreen) {
				element[reqFS]();
			} else {
				document[exitFS]();
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
