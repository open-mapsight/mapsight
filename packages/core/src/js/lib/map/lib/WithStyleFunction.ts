import type {StyleFunction} from "ol/style/Style";

import type {
	MapsightStyleFunction,
	MapsightStyleFunctionEnv,
} from "@mapsight/lib-ol/style/styleFunction";

import WithMap from "./WithMap";

export default class WithStyleFunction extends WithMap {
	private _styleFunctionRef: MapsightStyleFunction | undefined;
	private _defaultStyleEnv: MapsightStyleFunctionEnv = {};

	setStyleFunction(styleFunction: MapsightStyleFunction) {
		this._styleFunctionRef = styleFunction;
	}

	/**
	 * Merged into every style call before layer env and view state (zoom, etc.).
	 * Patches merge into the existing env (historic Redux `setStyleEnv` behavior);
	 * they do not replace it.
	 */
	setDefaultStyleEnv(env: MapsightStyleFunctionEnv) {
		this._defaultStyleEnv = {
			...this._defaultStyleEnv,
			...env,
		};
	}

	createStyleFunction(env: MapsightStyleFunctionEnv = {}): StyleFunction {
		return (feature, _resolution) => {
			const map = this.getMap();
			if (!map) {
				console.error("Cannot style feature, because map is not set.");
				return undefined;
			}

			const view = map.getView();

			if (!this._styleFunctionRef) {
				console.error(
					"Cannot style feature, because styleFunction is missing. Set it with mapController.setStyleFunction(fn).",
				);
				return undefined;
			}

			const zoom = view.getZoom();

			return this._styleFunctionRef(
				{
					...this._defaultStyleEnv,
					...env,

					// TODO: Use store state instead of view object?
					zoom: zoom !== undefined ? Math.round(zoom) : zoom,
					resolution: view.getResolution(),
					rotation: view.getRotation(),
					size: map.getSize(),
				},
				feature,
			);
		};
	}
}
