/* eslint-disable @typescript-eslint/ban-ts-comment */
import type BaseLayer from "ol/layer/Base";

import type {BaseController} from "@/lib/base/controller";
import type {MapController} from "@/lib/map/controller";
import type {MapState} from "@/lib/map/types";

const OL_PRIVATE_MEMBER_PREFIX = "__nnms3__";
const OL_PRIVATE_MEMBER_CONTROLLER = OL_PRIVATE_MEMBER_PREFIX + "controller";
const OL_PRIVATE_MEMBER_LAYER_GROUP = OL_PRIVATE_MEMBER_PREFIX + "layerGroup";
const OL_PRIVATE_MEMBER_LAYER_ID = OL_PRIVATE_MEMBER_PREFIX + "layerId";

export function getGroupForLayer(layer: BaseLayer): string | undefined {
	// @ts-ignore
	return layer?.[OL_PRIVATE_MEMBER_LAYER_GROUP] ?? undefined;
}

export function getIdForLayer(layer: BaseLayer): string | undefined {
	// @ts-ignore
	return layer?.[OL_PRIVATE_MEMBER_LAYER_ID] ?? undefined;
}

export function getControllerForLayer(
	layer: BaseLayer,
): MapController | undefined {
	// @ts-ignore
	return layer?.[OL_PRIVATE_MEMBER_CONTROLLER] ?? undefined;
}

export function tagLayer(
	layer: BaseLayer,
	controller: BaseController<MapState>,
	id: string,
	group: string | undefined = undefined,
) {
	// TODO: Check if we should use a WeakSet or property descriptors to hide the tags even more (eg. non-enumerable)
	// @ts-ignore
	layer[OL_PRIVATE_MEMBER_CONTROLLER] = controller;
	// @ts-ignore
	layer[OL_PRIVATE_MEMBER_LAYER_ID] = id;
	// @ts-ignore
	layer[OL_PRIVATE_MEMBER_LAYER_GROUP] = group;
}
