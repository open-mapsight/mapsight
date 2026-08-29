import type {FeatureSourceCache} from "@/lib/feature-sources/cache/types";

const inflightByCache = new WeakMap<
	FeatureSourceCache,
	Map<string, Promise<unknown>>
>();

/**
 * One in-flight loader per cache key so a stampede shares a single fetch.
 */
export function singleFlight<T>(
	cache: FeatureSourceCache,
	key: string,
	load: () => Promise<T>,
): Promise<T> {
	let inflight = inflightByCache.get(cache);
	if (!inflight) {
		inflight = new Map();
		inflightByCache.set(cache, inflight);
	}

	const existing = inflight.get(key);
	if (existing) {
		return existing as Promise<T>;
	}

	const pending = load().finally(() => {
		inflight.delete(key);
	});
	inflight.set(key, pending);
	return pending;
}
