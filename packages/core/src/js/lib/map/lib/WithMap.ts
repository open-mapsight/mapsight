import type OlMap from "ol/Map";
import type OlView from "ol/View";

import isEqual from "lodash/isEqual";

import type {MapState, Options} from "@/lib/map/types";
//import updateSizeOnTransitionEnd from "@mapsight/lib-ol/map/updateSizeOnTransitionEnd";
//import canvasSizeFixer from "@mapsight/lib-ol/map/canvasSizeFixer";
import {di, setOptions, updateProxyObject} from "@/ol-proxy";
import Map from "@/ol-proxy/definitions/Map";
import View from "@/ol-proxy/definitions/View";

import {async, controlled, quiet, setAll} from "../../base/actions";
import {BaseController} from "../../base/controller";
import throttleDispatch from "./throttleDispatch";

// Legacy. We always need Map and View, so we inject it by default. This should not be done here.
di.injectDefinitions([Map, View]);

export default class WithMap extends BaseController<MapState> {
	private _map: OlMap | null = null;

	getMap() {
		return this._map;
	}

	// TODO: use store instead
	getMinResolution() {
		return this.getMap()?.getView().getMinResolution();
	}

	// TODO: use store instead
	getMaxResolution() {
		return this.getMap()?.getView().getMaxResolution();
	}

	forEachFeatureAtPixel(
		...args: Parameters<typeof OlMap.prototype.forEachFeatureAtPixel>
	) {
		return this.getMap()?.forEachFeatureAtPixel(...args);
	}

	override init() {
		if (typeof document === "undefined") {
			console.warn(
				"No document defined (SSR without simulated DOM)! Skipping map init.",
			);
			return;
		}

		this._map = null;

		const name = this.getName();
		let view: undefined | OlView = undefined;

		const syncView = (nextView: OlView) => {
			this.dispatch(
				async(() => {
					if (view !== nextView) return;
					const zoom = nextView.getZoom();
					const center = nextView.getCenter();
					const projected = nextView.getCenterInternal();
					this.dispatch(
						quiet(
							controlled(
								setAll([name, "view"], {
									center,
									centerSnapshot:
										center && projected
											? {
													center,
													projected,
												}
											: undefined,
									zoom:
										zoom === undefined
											? undefined
											: Math.round(zoom),
									resolution: nextView.getResolution(),
									rotation: nextView.getRotation(),
								}),
							),
						),
					);
				}),
			);
		};

		this.getAndObserveUncontrolled(
			(state) => state.view as Options | undefined,
			(newOptions, oldOptions) => {
				const previousView = view;
				updateProxyObject({
					di: di,
					oldObject: view,
					oldDefinition: {type: "View", options: oldOptions},
					newDefinition: {type: "View", options: newOptions},
					remover() {
						view = undefined;
					},
					adder: (nextView: OlView) => {
						view = nextView;

						if (this._map) {
							this._map.setView(view);
						}

						view.on(
							[
								"change:center",
								"change:resolution",
								"change:rotation",
							],
							throttleDispatch(() => syncView(nextView)),
						);
						syncView(nextView);
					},
				});
				// A requested center can clamp to the current position without an event.
				const requestedCenter = newOptions?.center;
				if (
					view &&
					view === previousView &&
					requestedCenter != null &&
					requestedCenter !== oldOptions?.center &&
					!isEqual(requestedCenter, view.getCenter())
				) {
					syncView(view);
				}
			},
		);

		const {Constructor, optionMap} = Map;
		const map = new Constructor({
			view,
			controls: [], // see ./lib/withControls.js
			interactions: [], // see ./lib/withInteractions.js
		});
		this.getAndObserveUncontrolled(
			(state) => state.map as Options | undefined,
			(newOptions, oldOptions) => {
				const map = this.getMap();
				if (map && newOptions) {
					setOptions(map, oldOptions, newOptions, optionMap);
				}
			},
		);

		this._map = map;

		//updateSizeOnTransitionEnd(map);
		//canvasSizeFixer(map);
	}
}
