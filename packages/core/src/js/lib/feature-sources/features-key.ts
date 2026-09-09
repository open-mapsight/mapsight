/**
 * Fingerprint of a FeatureCollection’s `features` array plus parsing-relevant
 * metadata (`crs`). Volatile poll fields such as `buildTimestamp` are excluded.
 *
 * Pulp / xhr-json bodies often change top-level metadata on every poll.
 * Compare this key, not the whole collection, before `GeoJSON.readFeatures`.
 */
export function featureCollectionFeaturesCount(
	data: {features?: unknown} | null | undefined,
): number | undefined {
	return Array.isArray(data?.features) ? data.features.length : undefined;
}

function encodeFingerprint(value: unknown): unknown {
	if (value === undefined) {
		return ["u"];
	}
	if (value === null) {
		return ["z"];
	}
	if (typeof value === "string") {
		return ["s", value];
	}
	if (typeof value === "boolean") {
		return ["b", value];
	}
	if (typeof value === "number") {
		if (Number.isNaN(value)) {
			return ["n"];
		}
		if (value === Infinity) {
			return ["p"];
		}
		if (value === -Infinity) {
			return ["m"];
		}
		return ["d", value];
	}
	if (Array.isArray(value)) {
		return ["a", value.map(encodeFingerprint)];
	}
	if (typeof value === "object") {
		return [
			"o",
			Object.entries(value).map(([key, child]) => [
				key,
				encodeFingerprint(child),
			]),
		];
	}
	return ["t", typeof value];
}

function fingerprintJson(value: unknown): string {
	return JSON.stringify(encodeFingerprint(value)) ?? "null";
}

export function featureCollectionFeaturesKey(
	data: {features?: unknown; [key: string]: unknown} | null | undefined,
): string | undefined {
	if (!data || data.features === undefined) {
		return undefined;
	}

	const featuresJson = fingerprintJson(data.features);
	const payload =
		"crs" in data && data.crs !== undefined
			? `${featuresJson}\0crs:${fingerprintJson(data.crs)}`
			: featuresJson;
	return hashString(payload).toString(36);
}

/** Next fingerprint for a store write. Always the real hash so a later metadata-only poll can skip. */
export function nextFeatureCollectionFeaturesKey(
	data: {features?: unknown; [key: string]: unknown} | null | undefined,
): {count: number | undefined; key: string | undefined} {
	const count = featureCollectionFeaturesCount(data);
	if (data?.features === undefined) {
		return {count: undefined, key: undefined};
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
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
	h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
	return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
