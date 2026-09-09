import {documentCacheKeyMatchesUrl} from "@/lib/feature-sources/cache/build-cache-key";
import type {FeatureSourceCache} from "@/lib/feature-sources/cache/types";
import {resolveXhrJsonUrl} from "@/lib/feature-sources/loaders/xhr-json-loader";

type CacheFlightState = {
	generation: number;
	urlGeneration: Map<string, number>;
	inflight: Map<string, Promise<unknown>>;
	writeChain: Promise<void>;
};

const stateByCache = new WeakMap<FeatureSourceCache, CacheFlightState>();

function flightState(cache: FeatureSourceCache): CacheFlightState {
	let state = stateByCache.get(cache);
	if (!state) {
		state = {
			generation: 0,
			urlGeneration: new Map(),
			inflight: new Map(),
			writeChain: Promise.resolve(),
		};
		stateByCache.set(cache, state);
	}
	return state;
}

export type CacheWriteGeneration = {
	global: number;
	url: number;
};

/**
 * Serialize generation checks with `put`/`delete` so a purge cannot finish
 * while an already-started adapter write is still pending.
 */
export async function withDocumentCacheWrite<T>(
	cache: FeatureSourceCache,
	fn: () => Promise<T>,
): Promise<T> {
	const state = flightState(cache);
	const previous = state.writeChain;
	let release: () => void = () => undefined;
	state.writeChain = new Promise<void>((resolve) => {
		release = resolve;
	});
	await previous;
	try {
		return await fn();
	} finally {
		release();
	}
}

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
	url: string,
): CacheWriteGeneration {
	const state = flightState(cache);
	const resolved = resolveXhrJsonUrl(url);
	return {
		global: state.generation,
		url: state.urlGeneration.get(resolved) ?? 0,
	};
}

export function isCacheWriteGenerationCurrent(
	cache: FeatureSourceCache,
	url: string,
	generation: CacheWriteGeneration,
): boolean {
	const state = flightState(cache);
	if (generation.global !== state.generation) {
		return false;
	}
	return (
		generation.url ===
		(state.urlGeneration.get(resolveXhrJsonUrl(url)) ?? 0)
	);
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

type ShareableFlightResult<T> = {share: true; value: T} | {share: false};

/**
 * Like `singleFlight`, but waiters do not observe `value` unless the leader
 * marked the result shareable. Unshareable bodies stay with the leader;
 * waiters run `load` themselves.
 */
export async function singleFlightIfShareable<T>(
	cache: FeatureSourceCache,
	key: string,
	load: () => Promise<{value: T; share: boolean}>,
): Promise<T> {
	const state = flightState(cache);
	const existing = state.inflight.get(key);
	if (existing) {
		const joined = (await existing) as ShareableFlightResult<T>;
		if (joined.share) {
			return joined.value;
		}
		const own = await load();
		return own.value;
	}

	let local: T | undefined;
	let hasLocal = false;
	const pending = (async (): Promise<ShareableFlightResult<T>> => {
		const result = await load();
		if (result.share) {
			return {share: true as const, value: result.value};
		}
		local = result.value;
		hasLocal = true;
		return {share: false as const};
	})().finally(() => {
		if (state.inflight.get(key) === pending) {
			state.inflight.delete(key);
		}
	});
	state.inflight.set(key, pending);
	const published = await pending;
	if (published.share) {
		return published.value;
	}
	if (hasLocal) {
		return local as T;
	}
	const own = await load();
	return own.value;
}
