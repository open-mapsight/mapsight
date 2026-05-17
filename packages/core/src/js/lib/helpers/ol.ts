import type OlFeature from "ol/Feature";

import type {FeatureId} from "@/types";

export function getOlFeatureId(feature: OlFeature): FeatureId | undefined {
	const id = feature.getId();
	return id === undefined ? undefined : String(id);
}
