import type Control from "ol/control/Control";

import forEach from "lodash/forEach";

import type {MapController} from "@/lib/map/controller";
import {di, updateProxyObject} from "@/ol-proxy";

import WithMap from "./WithMap";
import proxyPassOpenLayersEventsToMapController from "./proxyPassOpenLayersEventsToMapController";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ControlDefinition = any; // TODO: Implement types for definitions in redux and ol-proxy

export default class WithControls extends WithMap {
	override init() {
		const map = this.getMap();
		if (!map) {
			console.error(
				"Could not initialize WithControls mixin. Map is not defined.",
			);
			return;
		}

		const controls: Record<string, Control> = {};

		this.getAndObserveUncontrolled(
			(state) => state.controls as Record<string, ControlDefinition>,
			(newDefinitions = {}, oldDefinitions = {}) => {
				forEach(newDefinitions, (newDefinition, id) =>
					updateProxyObject({
						di: di,
						oldObject: controls[id],
						oldDefinition: oldDefinitions && oldDefinitions[id],
						newDefinition: newDefinition,
						remover: () => {
							const control = controls[id];
							if (control !== undefined) {
								map.removeControl(control);
							}
							delete controls[id];
						},
						adder: (object) => {
							controls[id] = object;
							map.addControl(object);
							proxyPassOpenLayersEventsToMapController(
								this as unknown as MapController,
								object,
								newDefinition.type,
								id,
							);
						},
						parentObject: this,
					}),
				);
			},
		);
	}
}
