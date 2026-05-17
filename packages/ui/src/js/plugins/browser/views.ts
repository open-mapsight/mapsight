import throttle from "lodash/throttle";

import {VIEW_DESKTOP, VIEW_MOBILE, type View} from "../../config/constants/app";
import {setViewBreakpoints} from "../../store/actions";
import type {
	MapsightUiContext,
	MapsightUiView,
	PluginInstance,
} from "../../types.ts";

const getViewportWidth = () =>
	Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

const defaultResizeThrottleWait = 100;

function defaultDetermineInitialClientRenderingView(
	currentBreakpoints: string[],
	_context: MapsightUiContext,
): View {
	// NOTE: This will only be used for client side only rendering, otherwise INITIAL view will be determined by server!
	return currentBreakpoints.indexOf("mobile") > -1
		? VIEW_MOBILE
		: VIEW_DESKTOP;
}

/**
 * This plugin will dispatch breakpoint changes for the specified renderBreakpoints (@see {CreateOptions.renderBreakpoints})
 *
 * @param [options] options
 * @param [options.determineInitialView] function to determine the INITIAL view breakpoint for
 *              the given currently active render breakpoints. Used for client-side rendering ONLY! Otherwise the initial view
 *              is determined server side.
 * @param [options.resizeThrottleWait=100] ms to wait between window resize events before updating breakpoints
 * @returns  plugin instance
 */
export default function createPlugin(
	options: {
		determineInitialView?: (
			currentBreakpoints: string[],
			context: MapsightUiContext,
		) => View;
		resizeThrottleWait?: number;
	} = {},
): PluginInstance {
	const {
		determineInitialView = defaultDetermineInitialClientRenderingView,
		resizeThrottleWait = defaultResizeThrottleWait,
	} = options;

	// sorted {label: [min (included), max (included)]}
	// -1 = Infinity
	let currentBreakpoints: MapsightUiView[] = [];
	let currentWidth: number;
	let renderBreakpoints: Record<string, [number, number]> = {};

	if (typeof window === "undefined") {
		console.error("This plugin will only work as intended in the browser!");
	}

	let isInitialSetDone = false;
	return {
		afterInit: function viewsInitPlugin(context) {
			currentWidth = getViewportWidth();
			renderBreakpoints = context.createOptions.renderBreakpoints ?? {};
			currentBreakpoints = calculateCurrentBreakpoints(
				renderBreakpoints,
				currentWidth,
			);

			if (!context.isStateReHydrated && context.initialState?.app) {
				context.initialState.app.view = determineInitialView(
					currentBreakpoints,
					context,
				);
			}
		},
		afterCreate: function viewsCreatePlugin(context) {
			// We cannot change the state before we have not at least rendered the dehydrated html at least once
			// to prevent a mixed up DOM when predicted (server-side) view and client-side determined view mismatch or has changed
			// since page load. If the app is not rehydrated but initially rendered in the client we can omit the additional render
			// and set the view breakpoints on creation (before render).
			if (!context.isStateReHydrated) {
				isInitialSetDone = true;
				context.store?.dispatch(setViewBreakpoints(currentBreakpoints));
			}

			window.addEventListener(
				"resize",
				throttle(function handleWindowResize() {
					const widthBefore = currentWidth;
					currentWidth = getViewportWidth();
					if (widthBefore === currentWidth) {
						return;
					}

					const breakpointsBefore = currentBreakpoints;
					currentBreakpoints = calculateCurrentBreakpoints(
						renderBreakpoints,
						currentWidth,
					);
					if (
						(context.hasRendered &&
							diffBreakpoints(
								breakpointsBefore,
								currentBreakpoints,
							).length) ||
						diffBreakpoints(currentBreakpoints, breakpointsBefore)
							.length
					) {
						context.store?.dispatch(
							setViewBreakpoints(currentBreakpoints),
						);
						isInitialSetDone = true;
					}
				}, resizeThrottleWait),
			);
		},
		afterRender: function (context) {
			if (!isInitialSetDone) {
				isInitialSetDone = true;
				context.store?.dispatch(setViewBreakpoints(currentBreakpoints));
			}
		},
	};
}

function diffBreakpoints(a: string[], b: string[]): string[] {
	return a.filter((x) => !b.includes(x));
}

function calculateCurrentBreakpoints(
	breakpoints: Record<MapsightUiView, [number, number]>,
	currentWidth: number,
) {
	return Object.keys(breakpoints).filter((key: MapsightUiView) => {
		const from = breakpoints[key][0];
		const end = breakpoints[key][1];

		return from <= currentWidth && (end === -1 || end >= currentWidth);
	}) as MapsightUiView[];
}
