import {
	type FeatureSourceLoadState,
	getFeatureSourceLoadState,
} from "@/lib/feature-sources/load-state";
import type {
	FeatureSourceState,
	FeatureSourcesState,
} from "@/lib/feature-sources/types";

/** The part of a store these helpers need. Any Redux store fits. */
export type FeatureSourceStoreLike = {
	getState(): unknown;
	subscribe(listener: () => void): () => void;
};

export type FeatureSourceSettledStatus = "settled" | "timeout" | "aborted";

export type WhenFeatureSourcesSettledOptions = {
	/** Stops waiting and resolves with `status: "aborted"`. */
	signal?: AbortSignal;
	/** Resolves with `status: "timeout"` after this many milliseconds. No timeout by default. */
	timeoutMs?: number;
	/**
	 * Replaces the default condition (every source is `ok`, `error` or
	 * `missing`). Called with the current state of every listed id; must be
	 * synchronous and must not throw.
	 */
	isSettled?: (states: Record<string, FeatureSourceLoadState>) => boolean;
	/**
	 * `"next-completion"` waits for a request that starts after this call and
	 * ends, instead of accepting the current state. Use it after
	 * `load(..., {forceRefresh: true})` for a source that already has data.
	 * Until a source has started such a request it is reported as `loading`
	 * (a `missing` source stays `missing`). A request already in flight when
	 * the call is made counts as well. If no request ever starts, for example
	 * because a source with an `error` was loaded without `forceRefresh`, only
	 * `timeoutMs` or `signal` end the wait.
	 */
	after?: "next-completion";
};

export type FeatureSourcesSettledResult = {
	status: FeatureSourceSettledStatus;
	/** Load state of every listed id when the wait ended. */
	sources: Record<string, FeatureSourceLoadState>;
};

export type FeatureSourceSettledResult = {
	status: FeatureSourceSettledStatus;
	state: FeatureSourceLoadState;
};

const isSettledByDefault = (states: Record<string, FeatureSourceLoadState>) =>
	Object.values(states).every(
		(state) => state === "ok" || state === "error" || state === "missing",
	);

/**
 * Resolves once the listed feature sources have settled. The returned promise
 * never rejects.
 *
 * `dispatch(load(...))` says nothing about completion: loads are queued, skipped
 * while a request is pending or the source has an error, and failures are not
 * thrown. This helper observes the state instead and does not change how loads
 * are dispatched.
 *
 * By default a source is settled when it is `ok`, `error` or `missing` (see
 * `getFeatureSourceLoadState`). A source that was just added is `idle`, which is
 * not settled: the wait continues until a load has been dispatched and finished.
 * Dispatch the load before or after calling this; both work. A source removed
 * while waiting becomes `missing` and counts as settled. A refreshing source
 * (`doRefresh` + `timer`) settles on its data, not on its timer.
 *
 * If the condition already holds, the promise resolves immediately (as a
 * promise). A signal that is already aborted wins over that. The store
 * subscription, timer and abort listener are always released.
 *
 * @param store any store with `getState` and `subscribe`
 * @param controllerName name of the feature sources controller, usually `featureSources`
 * @param ids feature source ids to wait for
 * @param options see {@link WhenFeatureSourcesSettledOptions}
 */
export function whenFeatureSourcesSettled(
	store: FeatureSourceStoreLike,
	controllerName: string,
	ids: readonly string[],
	options: WhenFeatureSourcesSettledOptions = {},
): Promise<FeatureSourcesSettledResult> {
	const {signal, timeoutMs, isSettled = isSettledByDefault, after} = options;

	return new Promise((resolve) => {
		let finished = false;
		// Released exactly once when the wait ends, whatever ends it.
		const cleanups: Array<() => void> = [];
		let lastSources: Array<FeatureSourceState | undefined> | undefined;
		let lastStates: Record<string, FeatureSourceLoadState> = {};

		// For `after`: request number seen at the first read, and the ids that
		// have started a request since (or were loading from the beginning).
		let baseline: Array<number | undefined> | undefined;
		const started = new Set<string>();

		function read() {
			const all = (store.getState() as Record<string, unknown>)[
				controllerName
			] as FeatureSourcesState | undefined;
			const sources = ids.map((id) => all?.[id]);
			if (
				lastSources &&
				sources.every((source, index) => source === lastSources![index])
			) {
				return lastStates;
			}

			baseline ??= sources.map((source) => source?.requestId);
			const states: Record<string, FeatureSourceLoadState> = {};
			ids.forEach((id, index) => {
				const source = sources[index];
				let state = getFeatureSourceLoadState(source);
				if (after === "next-completion" && source) {
					if (
						source.isLoading ||
						source.requestId !== baseline![index]
					) {
						started.add(id);
					}
					if (!started.has(id)) {
						state = "loading";
					}
				}
				states[id] = state;
			});
			lastSources = sources;
			lastStates = states;
			return states;
		}

		function finish(status: FeatureSourceSettledStatus) {
			if (finished) {
				return;
			}
			finished = true;
			cleanups.forEach((cleanup) => cleanup());
			resolve({status, sources: read()});
		}

		function check() {
			if (!finished && isSettled(read())) {
				finish("settled");
			}
		}

		function onAbort() {
			finish("aborted");
		}

		if (signal?.aborted) {
			finish("aborted");
			return;
		}
		if (isSettled(read())) {
			finish("settled");
			return;
		}

		cleanups.push(store.subscribe(check));
		if (signal) {
			signal.addEventListener("abort", onAbort, {once: true});
			cleanups.push(() => signal.removeEventListener("abort", onAbort));
		}
		if (timeoutMs !== undefined) {
			const timer = setTimeout(() => finish("timeout"), timeoutMs);
			cleanups.push(() => clearTimeout(timer));
		}
	});
}

/** Single-source form of {@link whenFeatureSourcesSettled}. */
export async function whenFeatureSourceSettled(
	store: FeatureSourceStoreLike,
	controllerName: string,
	id: string,
	options: Omit<WhenFeatureSourcesSettledOptions, "isSettled"> & {
		isSettled?: (state: FeatureSourceLoadState) => boolean;
	} = {},
): Promise<FeatureSourceSettledResult> {
	const {isSettled, ...rest} = options;
	const result = await whenFeatureSourcesSettled(
		store,
		controllerName,
		[id],
		isSettled
			? {...rest, isSettled: (states) => isSettled(states[id]!)}
			: rest,
	);
	return {status: result.status, state: result.sources[id]!};
}
