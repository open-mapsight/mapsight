/**
 * Stable key for a FeatureCollection’s `features` array.
 *
 * Pulp / xhr-json bodies often change top-level metadata (`buildTimestamp`)
 * on every poll. Compare this key, not the whole collection, before
 * `GeoJSON.readFeatures`.
 */
export function featureCollectionFeaturesKey(
	data: {features?: unknown; [key: string]: unknown} | null | undefined,
): string | undefined {
	if (!data || data.features === undefined) {
		return undefined;
	}

	return JSON.stringify(data.features);
}
