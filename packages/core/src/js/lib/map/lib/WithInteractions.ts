import type Interaction from "ol/interaction/Interaction";

import forEach from "lodash/forEach";

import type {MapController} from "@/lib/map/controller";
import {di, updateProxyObject} from "@/ol-proxy";

import WithMap from "./WithMap";
import proxyPassOpenLayersEventsToMapController from "./proxyPassOpenLayersEventsToMapController";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InteractionDefinition = any; // TODO: Implement types for definitions in redux and ol-proxy

export default class WithInteractions extends WithMap {
	override init() {
		const map = this.getMap();
		if (!map) {
			console.error(
				"Could not initialize WithInteractions mixin. Map is not defined.",
			);
			return;
		}

		const interactions: Record<string, Interaction> = {};

		let oldDefinitions: Record<string, InteractionDefinition> = {};
		this.getAndObserveUncontrolled(
			(state) =>
				state.interactions as Record<string, InteractionDefinition>,
			(newDefinitions = {}) => {
				forEach(newDefinitions, (newDefinition, id) =>
					updateProxyObject({
						di: di,
						oldObject: interactions[id],
						oldDefinition: oldDefinitions && oldDefinitions[id],
						newDefinition: newDefinition,
						remover: () => {
							const interaction = interactions[id];
							if (interaction !== undefined) {
								map.removeInteraction(interaction);
							}
							delete interactions[id];
						},
						adder: (object) => {
							interactions[id] = object;
							map.addInteraction(object);
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

				oldDefinitions = newDefinitions;
			},
		);
	}
}
