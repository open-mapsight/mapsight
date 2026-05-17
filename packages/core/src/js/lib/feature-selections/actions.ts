import {addTo, removeFrom, set} from "@/lib/base/actions";
import type {FeatureId} from "@/types";

export function selectExclusively(
	controllerName: string,
	selectionId: string,
	featureId: FeatureId | Array<FeatureId>,
) {
	return set(
		[controllerName, selectionId, "features"],
		Array.isArray(featureId) ? featureId : [featureId],
	);
}

export function select(
	controllerName: string,
	selectionId: string,
	featureId: FeatureId,
) {
	return addTo([controllerName, selectionId, "features"], featureId);
}

export function deselectAll(controllerName: string, selectionId: string) {
	return selectExclusively(controllerName, selectionId, []);
}

export function deselect(
	controllerName: string,
	selectionId: string,
	featureId: FeatureId,
) {
	return removeFrom([controllerName, selectionId, "features"], featureId);
}
