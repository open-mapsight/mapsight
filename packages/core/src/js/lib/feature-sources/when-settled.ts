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
	 *
	 * A source counts as having started such a request once its `requestId`
	 * is a number that differs from the one it had at the time of the call. A
	 * request that is already in flight at the call does not count, and neither
	 * does the completion of a request that was queued or running earlier: to
	 * wait for whatever is pending right now, use the default condition. Until a
	 * source has started a request it is reported as `loading` (a `missing`
	 * source stays `missing`). A source that is removed and added again is
	 * treated as a new source and has to start its own request.
	 *
	 * If no request ever starts, for example because a source with an `error`
	 * was loaded without `forceRefresh`, only `timeoutMs` or `signal` end the
	 * wait.
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

const createDictionary = () =>
	Object.create(null) as Record<string, FeatureSourceLoadState>;

/** A request number that the controller assigned. Anything else is no request. */
const isRequestId = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value);

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
 * promise). A signal that is already aborted wins over that. An empty id list
 * has nothing to wait for and resolves as `settled` without calling
 * `isSettled`. Duplicate ids are waited for once. The store subscription,
 * timer and abort listener are always released.
 *
 * The result lists every id once, in the order given. It is a plain object
 * without a prototype, so any id is safe as a key, including `__proto__`.
 * Ids are looked up as own properties of the controller's state.
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

	const uniqueIds = [...new Set(ids)];

	return new Promise((resolve) => {
		let finished = false;
		// Released exactly once when the wait ends, whatever ends it.
		const cleanups: Array<() => void> = [];
		let lastSources: Array<FeatureSourceState | undefined> | undefined;
		let lastStates = createDictionary();

		// For `after`: the request number each present source had when it was
		// first seen, and the ids that have started a request since. A source
		// that appears later (or again, after it was gone) has no baseline: any
		// request it shows was started after the call.
		const baselines = new Map<string, number | undefined>();
		const started = new Set<string>();
		let firstRead = true;

		// Cleanup that is registered after the wait ended runs at once.
		function onCleanup(cleanup: () => void) {
			if (finished) {
				cleanup();
			} else {
				cleanups.push(cleanup);
			}
		}

		function read() {
			const root = store.getState() as
				Record<string, unknown> | undefined;
			const all = root?.[controllerName] as
				FeatureSourcesState | undefined;
			const sources = uniqueIds.map((id) =>
				all && Object.hasOwn(all, id) ? all[id] : undefined,
			);
			if (
				lastSources &&
				sources.every((source, index) => source === lastSources![index])
			) {
				return lastStates;
			}

			const states = createDictionary();
			uniqueIds.forEach((id, index) => {
				const source = sources[index];
				let state = getFeatureSourceLoadState(source);
				if (after === "next-completion") {
					if (!source) {
						baselines.delete(id);
						started.delete(id);
					} else {
						if (!baselines.has(id)) {
							baselines.set(
								id,
								firstRead && isRequestId(source.requestId)
									? source.requestId
									: undefined,
							);
						}
						if (
							isRequestId(source.requestId) &&
							source.requestId !== baselines.get(id)
						) {
							started.add(id);
						}
						if (!started.has(id)) {
							state = "loading";
						}
					}
				}
				states[id] = state;
			});
			firstRead = false;
			lastSources = sources;
			lastStates = states;
			return states;
		}

		function finish(status: FeatureSourceSettledStatus) {
			if (finished) {
				return;
			}
			finished = true;
			const result = read();
			cleanups.splice(0).forEach((cleanup) => cleanup());
			resolve({status, sources: result});
		}

		// The condition is user code. It may change the store or abort the
		// signal, so a change that arrives while it runs is not lost and it is
		// never called re-entrantly.
		let checking = false;
		let changedWhileChecking = false;
		function check() {
			if (finished) {
				return;
			}
			if (checking) {
				changedWhileChecking = true;
				return;
			}
			checking = true;
			try {
				do {
					changedWhileChecking = false;
					const settled = isSettled(read());
					if (finished) {
						return;
					}
					if (signal?.aborted) {
						finish("aborted");
						return;
					}
					if (settled && !changedWhileChecking) {
						finish("settled");
						return;
					}
				} while (changedWhileChecking);
			} finally {
				checking = false;
			}
		}

		function onAbort() {
			finish("aborted");
		}

		if (signal?.aborted) {
			finish("aborted");
			return;
		}
		if (uniqueIds.length === 0) {
			finish("settled");
			return;
		}

		// Take the baseline, then subscribe before any user code runs.
		read();
		onCleanup(store.subscribe(check));
		if (finished) {
			return;
		}
		if (signal) {
			signal.addEventListener("abort", onAbort, {once: true});
			onCleanup(() => signal.removeEventListener("abort", onAbort));
		}
		if (timeoutMs !== undefined) {
			const timer = setTimeout(() => finish("timeout"), timeoutMs);
			onCleanup(() => clearTimeout(timer));
		}
		check();
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
