import type OlMap from "ol/Map";
import type OlView from "ol/View";

import type {MapState, Options} from "@/lib/map/types";
//import updateSizeOnTransitionEnd from "@mapsight/lib-ol/map/updateSizeOnTransitionEnd";
//import canvasSizeFixer from "@mapsight/lib-ol/map/canvasSizeFixer";
import {di, setOptions, updateProxyObject} from "@/ol-proxy";
import Map from "@/ol-proxy/definitions/Map";
import View from "@/ol-proxy/definitions/View";

import {async, controlled, quiet} from "../../base/actions";
import {BaseController} from "../../base/controller";
import {
	setViewCenter,
	setViewRotation,
	setViewZoomAndResolution,
} from "../actions";
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

		this.getAndObserveUncontrolled(
			(state) => state.view as Options | undefined,
			(newOptions, oldOptions) => {
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

						const handleResolution = () => {
							this.dispatch(
								async(() => {
									const zoom = view?.getZoom();
									const resolution = view?.getResolution();
									if (zoom && resolution) {
										this.dispatch(
											quiet(
												controlled(
													setViewZoomAndResolution(
														name,
														zoom,
														resolution,
													),
												),
											),
										);
									}
								}),
							);
						};

						const handleCenter = () => {
							this.dispatch(
								async(() => {
									const center = view?.getCenter();
									if (center) {
										this.dispatch(
											quiet(
												controlled(
													setViewCenter(name, center),
												),
											),
										);
									}
								}),
							);
						};

						const handleRotation = () => {
							this.dispatch(
								async(() => {
									const rotation = view?.getRotation();
									if (rotation) {
										this.dispatch(
											quiet(
												controlled(
													setViewRotation(
														name,
														rotation,
													),
												),
											),
										);
									}
								}),
							);
						};

						view.on(
							"change:resolution",
							throttleDispatch(handleResolution),
						);
						view.on(
							"change:center",
							throttleDispatch(handleCenter),
						);
						view.on(
							"change:rotation",
							throttleDispatch(handleRotation),
						);
					},
				});
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
