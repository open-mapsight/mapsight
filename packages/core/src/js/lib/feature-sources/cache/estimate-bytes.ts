import type {
	FeatureSourceData,
	FeatureSourcesState,
} from "@/lib/feature-sources/types";

/** UTF-8-ish byte estimate with a 1.2× fudge for object overhead. */
export function estimateFeatureSourceBytes(
	data: FeatureSourceData | null | undefined,
): number {
	if (!data) {
		return 0;
	}
	try {
		return Math.round(JSON.stringify(data).length * 1.2);
	} catch {
		return 0;
	}
}

/** Sum of L0 payload estimates (feature source `data` only, not whole Redux). */
export function estimateFeatureSourcesStateBytes(
	state: FeatureSourcesState,
): number {
	let total = 0;
	for (const source of Object.values(state)) {
		total += estimateFeatureSourceBytes(source.data);
	}
	return total;
}
