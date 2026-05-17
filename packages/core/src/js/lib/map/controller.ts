import * as olProj4 from "ol/proj/proj4";

import type {MapState} from "@/lib/map/types";
import type {State} from "@/types";

import {BaseController} from "../base/controller";
import {ProjectionsController} from "../projections/controller";
import type WithAnchoredViewport from "./lib/WithAnchoredViewport";
import WithAnimations from "./lib/WithAnimations";
import WithClusterFeatureFunction from "./lib/WithClusterFeatureFunction";
import WithControls from "./lib/WithControls";
import WithCursor from "./lib/WithCursor";
import WithFeatureInteractions from "./lib/WithFeatureInteractions";
import WithInteractions from "./lib/WithInteractions";
import WithLayerOverlays from "./lib/WithLayerOverlays";
import WithLayers from "./lib/WithLayers";
import WithMap from "./lib/WithMap";
import WithMounting from "./lib/WithMounting";
import WithSize from "./lib/WithSize";
import WithStyleFunction from "./lib/WithStyleFunction";
import WithVisibleLayers from "./lib/WithVisibleLayers";

export {DEFAULT_CURSOR} from "./lib/WithCursor";
export const ANIMATE_ONCE = "once";

export class BaseMapController<
	TState extends State,
> extends BaseController<TState> {
	override init() {
		olProj4.register(ProjectionsController.getProj4());
	}
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface MapController
	extends
		BaseMapController<MapState>,
		WithClusterFeatureFunction,
		WithMap,
		WithVisibleLayers,
		WithStyleFunction,
		WithCursor,
		WithControls,
		WithMounting,
		WithAnimations,
		WithLayers,
		WithLayerOverlays,
		WithSize,
		WithInteractions,
		WithFeatureInteractions,
		WithAnchoredViewport {}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class MapController extends BaseMapController<MapState> {}

const initFunctions: Array<() => void> = [];
for (const mixin of [
	WithClusterFeatureFunction,
	WithMap,
	WithVisibleLayers,
	WithStyleFunction,
	WithCursor,
	WithControls,
	WithMounting,
	WithAnimations,
	WithLayers,
	WithLayerOverlays,
	WithSize,
	WithInteractions,
	WithFeatureInteractions,
	//WithAnchoredViewport,
]) {
	for (const name of Object.getOwnPropertyNames(mixin.prototype)) {
		if (name === "init") {
			initFunctions.push(mixin.prototype[name]);
		} else if (name === "constructor") {
			// ignore
		} else if (Object.hasOwn(MapController.prototype, name)) {
			console.info(
				`Could not apply mixin because member "${name}" already exists on target!`,
			);
		} else {
			const propertyDescriptor = Object.getOwnPropertyDescriptor(
				mixin.prototype,
				name,
			);

			Object.defineProperty(
				MapController.prototype,
				name,
				propertyDescriptor || Object.create(null),
			);
		}
	}
}

MapController.prototype.init = function init() {
	BaseMapController.prototype.init.apply(this);

	for (const fn of initFunctions) {
		fn.apply(this);
	}
};
