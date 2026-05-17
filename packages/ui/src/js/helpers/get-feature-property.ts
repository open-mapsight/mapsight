import getPath from "@mapsight/lib-js/object/getPath";

import type {MapsightUiFeature, MapsightUiFeatureProperty} from "../types";

/**
 * Gets the property value by key, falling back to the specified fallback if value is not defined.
 */
export default function getFeatureProperty(
	feature: MapsightUiFeature,
	key: MapsightUiFeatureProperty,
	fallback: unknown = null,
) {
	return getPath(feature, ["properties", key], fallback);
}
