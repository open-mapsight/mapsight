import {documentCacheKeyMatchesUrl} from "@/lib/feature-sources/cache/build-cache-key";
import type {FeatureSourceCache} from "@/lib/feature-sources/cache/types";
import {resolveXhrJsonUrl} from "@/lib/feature-sources/loaders/xhr-json-loader";

type CacheFlightState = {
	generation: number;
	urlGeneration: Map<string, number>;
	inflight: Map<string, Promise<unknown>>;
};

const stateByCache = new WeakMap<FeatureSourceCache, CacheFlightState>();

function flightState(cache: FeatureSourceCache): CacheFlightState {
	let state = stateByCache.get(cache);
	if (!state) {
		state = {generation: 0, urlGeneration: new Map(), inflight: new Map()};
		stateByCache.set(cache, state);
	}
	return state;
}

function documentUrlFromCacheKey(key: string): string | undefined {
	if (!key.startsWith("doc:")) {
		return undefined;
	}
	const rest = key.slice(4);
	const colon = rest.indexOf(":");
	if (colon === -1) {
		return undefined;
	}
	return rest.slice(colon + 1);
}

export type CacheWriteGeneration = {
	global: number;
	url: number;
};

/**
 * Drop in-flight joins and reject later `put`s for work started before this
 * call. Omit `urls` (or pass []) to bust the whole adapter.
 */
export function bumpDocumentCacheGeneration(
	cache: FeatureSourceCache,
	urls?: readonly string[],
): void {
	const state = flightState(cache);
	const unique = [
		...new Set((urls ?? []).map((url) => url.trim()).filter(Boolean)),
	];
	if (unique.length === 0) {
		state.generation += 1;
		state.inflight.clear();
		return;
	}

	for (const url of unique) {
		const resolved = resolveXhrJsonUrl(url);
		state.urlGeneration.set(
			resolved,
			(state.urlGeneration.get(resolved) ?? 0) + 1,
		);
		for (const key of [...state.inflight.keys()]) {
			if (documentCacheKeyMatchesUrl(key, url)) {
				state.inflight.delete(key);
			}
		}
	}
}

export function captureCacheWriteGeneration(
	cache: FeatureSourceCache,
	key: string,
): CacheWriteGeneration {
	const state = flightState(cache);
	const url = documentUrlFromCacheKey(key);
	return {
		global: state.generation,
		url: url ? (state.urlGeneration.get(url) ?? 0) : 0,
	};
}

export function isCacheWriteGenerationCurrent(
	cache: FeatureSourceCache,
	key: string,
	generation: CacheWriteGeneration,
): boolean {
	const state = flightState(cache);
	if (generation.global !== state.generation) {
		return false;
	}
	const url = documentUrlFromCacheKey(key);
	if (!url) {
		return true;
	}
	return generation.url === (state.urlGeneration.get(url) ?? 0);
}

/**
 * One in-flight loader per cache key so a stampede shares a single fetch.
 */
export function singleFlight<T>(
	cache: FeatureSourceCache,
	key: string,
	load: () => Promise<T>,
): Promise<T> {
	const state = flightState(cache);
	const existing = state.inflight.get(key);
	if (existing) {
		return existing as Promise<T>;
	}

	const pending = load().finally(() => {
		if (state.inflight.get(key) === pending) {
			state.inflight.delete(key);
		}
	});
	state.inflight.set(key, pending);
	return pending;
}
