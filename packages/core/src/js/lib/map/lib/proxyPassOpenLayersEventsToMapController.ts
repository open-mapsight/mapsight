import type {Observable} from "ol";

import {di} from "@/ol-proxy";

import type {MapController} from "../controller";

/**
 * Passes emitted events, as defined in the dependency `eventMap` from the openlayers observable object to the
 * map controller, which re-emits it, using a schema of `${group}.${id}.${eventType}` as event names.
 *
 * For example a `drawend` event emitted by the draw interaction with id myDraw1 will be re-emitted by the map
 * controller as `interaction.myDraw1.drawend`. The openlayers event object will be passed as well as any other
 * additional arguments.
 *
 * @param mapController map controller
 * @param object the observable openlayers object
 * @param type the ol-proxy dependency name/type (e.g. `Draw` or `KML`)
 * @param [id="default"] the identifier of the object in context of the map controller
 */
function proxyPassOpenLayersEventsToMapController(
	mapController: MapController,
	object: Observable,
	type: string,
	id = "default",
) {
	const def = di.getDefinition(type);
	if (def !== undefined) {
		object.on(
			// TODO: Ugly workaround. We need to fix the type of `eventMap` in
			//        the ol-proxy to match the signature of the `on` method.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			def.eventMap as any,
			function handleProxyPassOpenLayersEventToMapController(
				event,
				...args
			) {
				mapController.emit(
					`${def.type}.${id}.${event.type}`,
					event,
					...args,
				);
			},
		);
	}
}

export default proxyPassOpenLayersEventsToMapController;
