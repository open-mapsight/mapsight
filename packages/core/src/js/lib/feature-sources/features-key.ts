/**
 * Fingerprint of a FeatureCollection’s `features` array.
 *
 * Pulp / xhr-json bodies often change top-level metadata (`buildTimestamp`)
 * on every poll. Compare this key, not the whole collection, before
 * `GeoJSON.readFeatures`.
 *
 * Computed when feature-source data is written. Array length is compared to
 * the previous write first; stringify + hash only run when the count is
 * unchanged (metadata-only polls and in-place property edits).
 */
export function featureCollectionFeaturesCount(
	data: {features?: unknown} | null | undefined,
): number | undefined {
	return Array.isArray(data?.features) ? data.features.length : undefined;
}

export function featureCollectionFeaturesKey(
	data: {features?: unknown; [key: string]: unknown} | null | undefined,
): string | undefined {
	if (!data || data.features === undefined) {
		return undefined;
	}

	return hashString(JSON.stringify(data.features)).toString(36);
}

/**
 * Next fingerprint for a store write. When `previousCount` is set and the
 * feature count changed, skip stringify — the map must reread anyway.
 */
export function nextFeatureCollectionFeaturesKey(
	data: {features?: unknown; [key: string]: unknown} | null | undefined,
	previousCount?: number,
): {count: number | undefined; key: string | undefined} {
	const count = featureCollectionFeaturesCount(data);
	if (data?.features === undefined) {
		return {count: undefined, key: undefined};
	}
	if (typeof previousCount === "number" && count !== previousCount) {
		return {count, key: `n:${count}`};
	}
	return {count, key: featureCollectionFeaturesKey(data)};
}

/**
 * cyrb53 (bryc) — 53-bit string hash that fits in a JS number.
 * Collision at a given feature count is not a practical risk for poll skips.
 */
function hashString(str: string): number {
	let h1 = 0xdeadbeef;
	let h2 = 0x41c6ce57;
	for (let i = 0; i < str.length; i++) {
		const ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}
	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
	h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 1597334677);
	h2 ^= Math.imul(h1 ^ (h1 >>> 16), 2246822507);
	return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
