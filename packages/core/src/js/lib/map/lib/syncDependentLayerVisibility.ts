import type {LayerState} from "@/lib/map/types";

/**
 * Derive visibility for layers that declare `metaData.visibleWhenLayerIds`.
 * Every listed layer must currently be visible (AND). Missing ids count as off.
 */
export function syncDependentLayerVisibility(
	layers: Record<string, LayerState>,
): Record<string, LayerState> {
	let result = layers;
	let copied = false;

	for (const [id, layer] of Object.entries(layers)) {
		const requiredIds = layer.metaData?.visibleWhenLayerIds;
		if (!requiredIds?.length) {
			continue;
		}

		const desired = requiredIds.every(
			(requiredId) => layers[requiredId]?.options?.visible === true,
		);
		const current = layer.options?.visible === true;
		if (desired === current) {
			continue;
		}

		if (!copied) {
			result = {...layers};
			copied = true;
		}
		result[id] = {
			...layer,
			options: {
				...layer.options,
				visible: desired,
			} as LayerState["options"],
		};
	}

	return result;
}
