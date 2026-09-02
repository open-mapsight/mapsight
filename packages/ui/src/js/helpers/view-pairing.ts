import type {View} from "../config/constants/app";
import {
	VIEW_DESKTOP,
	VIEW_FULLSCREEN,
	VIEW_MAP_ONLY,
	VIEW_MOBILE,
} from "../config/constants/app";

/** Full-viewport chrome that covers the host page (`position: fixed`). */
export function isOverlayChromeView(view: View): boolean {
	return view === VIEW_FULLSCREEN || view === VIEW_MAP_ONLY;
}

/**
 * The view the existing chrome toggle switches to.
 * Overlay views pair with the in-flow chrome they left (BITV/APG Escape).
 */
export function pairedView(view: View): View {
	switch (view) {
		case VIEW_MAP_ONLY:
			return VIEW_MOBILE;
		case VIEW_FULLSCREEN:
			return VIEW_DESKTOP;
		case VIEW_DESKTOP:
			return VIEW_FULLSCREEN;
		case VIEW_MOBILE:
		default:
			return VIEW_MAP_ONLY;
	}
}
