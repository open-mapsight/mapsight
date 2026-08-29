import {estimateFeatureSourceBytes} from "@/lib/feature-sources/cache/estimate-bytes";
import type {
	FeatureSourceCache,
	FeatureSourceCacheEntry,
} from "@/lib/feature-sources/cache/types";

export type MemoryFeatureSourceCache = FeatureSourceCache & {
	clear(): void;
	keys(): string[];
};

type StoredEntry = FeatureSourceCacheEntry & {lastAccessedAt: number};

/**
 * Process-memory adapter (`tier: "memory"`).
 *
 * Safe as a sidecar singleton: concurrent `render()` calls share one Map.
 * `evictLRU` is implemented for the shared interface; the warm set should not call it.
 */
export function createMemoryFeatureSourceCache(): MemoryFeatureSourceCache {
	const entries = new Map<string, StoredEntry>();

	function touch(entry: StoredEntry): StoredEntry {
		entry.lastAccessedAt = Date.now();
		return entry;
	}

	return {
		get(key) {
			const entry = entries.get(key);
			return Promise.resolve(entry ? {...touch(entry)} : null);
		},

		put(key, entry) {
			const bytes =
				entry.bytes > 0
					? entry.bytes
					: estimateFeatureSourceBytes(entry.data);
			entries.set(key, {
				...entry,
				key,
				bytes,
				tier: "memory",
				lastAccessedAt: Date.now(),
			});
			return Promise.resolve();
		},

		delete(key) {
			entries.delete(key);
			return Promise.resolve();
		},

		estimateTotalBytes() {
			let total = 0;
			for (const entry of entries.values()) {
				total += entry.bytes;
			}
			return Promise.resolve(total);
		},

		evictLRU(targetBytes) {
			const evicted: string[] = [];
			let total = 0;
			for (const entry of entries.values()) {
				total += entry.bytes;
			}
			if (total <= targetBytes) {
				return Promise.resolve(evicted);
			}

			const ordered = [...entries.values()].sort(
				(a, b) => a.lastAccessedAt - b.lastAccessedAt,
			);
			for (const entry of ordered) {
				if (total <= targetBytes) {
					break;
				}
				entries.delete(entry.key);
				total -= entry.bytes;
				evicted.push(entry.key);
			}
			return Promise.resolve(evicted);
		},

		clear() {
			entries.clear();
		},

		keys() {
			return [...entries.keys()];
		},
	};
}
