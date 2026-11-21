import type {FeatureSourceState} from "@/lib/feature-sources/types";

export type FeatureSourceLoadState =
	"missing" | "idle" | "loading" | "ok" | "error";

/**
 * Classifies one feature source for code that has to decide whether its data
 * is available yet. Pure and read-only; `getFeatureSourceStatus` is unchanged.
 *
 * Rules, checked in this order:
 *
 * - `missing`: there is no entry for the id.
 * - `loading`: a request is in flight (`isLoading`). A retry after a failure
 *   keeps the old `error` in state until it completes; it still counts as
 *   `loading`, because the outcome is not known yet. (`getFeatureSourceStatus`
 *   reports `error` there.)
 * - `error`: `error` is set. This covers failed loads, `setError`, and sources
 *   whose loader found nothing: a `noop` source without data and a `local`
 *   source whose selector has no data fail their first load with an error.
 *   Stale data may still be present.
 * - `ok`: data is present, including a configured or manually set collection
 *   that was never loaded, and an empty feature collection.
 * - `idle`: configured, but no data, no error and no request yet. This is the
 *   normal state after a source was added and before its first load was
 *   dispatched. It is not a final state.
 *
 * `combined` sources are filled by the controller from their members, not by a
 * request: they stay `idle` for the moment until the controller's first fill
 * (queued, so a few milliseconds), then are `ok` whether or not the members
 * have loaded. Wait for the members to know about their data. Sources bound to
 * another part of the store with `bindFeatureSourceToStore` (the search and
 * user geolocation plugins) also receive data or an error without a load.
 */
export function getFeatureSourceLoadState(
	source: FeatureSourceState | null | undefined,
): FeatureSourceLoadState {
	if (!source) {
		return "missing";
	}
	if (source.isLoading) {
		return "loading";
	}
	if (source.error != null) {
		return "error";
	}
	return source.data != null ? "ok" : "idle";
}
