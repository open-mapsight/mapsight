import type {State} from "@mapsight/core/types";

import {getAndObserveState} from "@mapsight/lib-redux/observe-state";

import {VIEW_FULLSCREEN, VIEW_MAP_ONLY} from "../../config/constants/app";
import type {RootStateSlice} from "../../store/selectors";
import {viewSelector} from "../../store/selectors";
import type {PluginInstance} from "../../types.ts";

function onTouchMoveNoScroll(e: TouchEvent) {
	e.preventDefault();
}

/**
 * create a no-scroll-handler
 *
 * @param selector redux store selector to test if scroll should be inhibited
 * @param [noScrollCssClass] class to set, default = 'ms3--map-no-scroll'
 * @returns function to update no-scroll state.
 */
export function createNoScrollHandler(
	selector: (state: unknown) => boolean,
	noScrollCssClass = "ms3--map-no-scroll",
) {
	return (state: State, forceAllow: boolean) => {
		const isNoScroll = !forceAllow && selector(state);
		if (isNoScroll) {
			window.document.documentElement.classList.add(noScrollCssClass);
			window.document.addEventListener("touchmove", onTouchMoveNoScroll);
		} else {
			window.document.documentElement.classList.remove(noScrollCssClass);
			window.document.removeEventListener(
				"touchmove",
				onTouchMoveNoScroll,
			);
		}

		return isNoScroll;
	};
}

export const defaultNoScrollHandler = createNoScrollHandler(
	(state: RootStateSlice) => {
		const view = viewSelector(state);
		return view === VIEW_MAP_ONLY || view === VIEW_FULLSCREEN;
	},
);
export const defaultNoScrollObserveSelector = viewSelector;

/**
 * This plugin will observe the state for changes to the view (default) and will call the defined handler.
 * By default, this will disable scrolling the document and add a class to the document element
 * when the view is in either "mapOnly" or "fullscreen" view.
 *
 * @param [options] options
 * @param [options.noScrollHandler] handler to call (will be passed the current state)
 * @param [options.noScrollObserveSelector] selector to observe state with
 * @returns {import('../../types').PluginInstance} plugin instance
 */
export default function createPlugin(
	options: {
		noScrollCssClass?: string;
		noScrollObserveSelector?: (state: State) => unknown;
		noScrollHandler?: (state: State, forceAllow: boolean) => void;
	} = {},
): PluginInstance {
	const {
		noScrollHandler = defaultNoScrollHandler,
		noScrollObserveSelector = defaultNoScrollObserveSelector,
	} = options;

	if (typeof window === "undefined") {
		console.info(
			"This plugin might not work as intended, if not run in the browser!",
		);
	}

	return {
		afterCreate: function noScrollPlugin(context) {
			const {store} = context;

			if (store) {
				getAndObserveState<State>(
					store,
					noScrollObserveSelector,
					(_old, _new, state) => noScrollHandler(state, false),
				);
			}
		},
	};
}
