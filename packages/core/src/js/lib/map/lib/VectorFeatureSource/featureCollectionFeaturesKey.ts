/**
 * Stable fingerprint for a FeatureCollection’s `features` array.
 *
 * Pulp / xhr-json bodies often change top-level metadata (`buildTimestamp`)
 * on every poll. Compare this key, not the whole collection, before
 * `GeoJSON.readFeatures`.
 *
 * The fingerprint is length + a 53-bit hash of `JSON.stringify(features)`,
 * not the JSON itself — parking / places payloads are large, and the source
 * already holds the parsed collection in Redux.
 */
export function featureCollectionFeaturesKey(
	data: {features?: unknown; [key: string]: unknown} | null | undefined,
): string | undefined {
	if (!data || data.features === undefined) {
		return undefined;
	}

	const json = JSON.stringify(data.features);
	return `${json.length.toString(36)}:${hashString(json).toString(36)}`;
}

/**
 * cyrb53 (bryc) — 53-bit string hash that fits in a JS number.
 * Collision with the same byte length is not a practical risk for poll skips.
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
