import type Feature from "ol/Feature";

import getUid from "./getUid";

export default function ensureId(feature: Feature): void {
	if (!feature.getId()) {
		feature.setId(getUid(feature));
	}
}
