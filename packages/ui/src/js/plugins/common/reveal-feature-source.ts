import {async} from "@mapsight/core/lib/base/actions";
import {load} from "@mapsight/core/lib/feature-sources/actions";
import {findFeatureSourceIdForFeatureId} from "@mapsight/core/lib/feature-sources/selectors";
import type {FeatureSourcesState} from "@mapsight/core/lib/feature-sources/types";
import {setLayerVisibility} from "@mapsight/core/lib/map/actions";
import type {MapState} from "@mapsight/core/lib/map/types";
import type {EnhancedStore, FeatureId} from "@mapsight/core/types";

import {AbortObserving, observeState} from "@mapsight/lib-redux/observe-state";

import {FEATURE_SOURCES, MAP} from "../../config/constants/controllers";

/** Place permalink query key for a catalog feature-source / layer id. */
export const FEATURE_SOURCE_SEARCH_PARAM = "src";

/**
 * Host utility sources that must never be written onto a place permalink.
 * `listCombined` is the usual visible-member union id.
 */
export const PERMALINK_SKIP_FEATURE_SOURCE_IDS = [
	"searchResult",
	"userGeolocation",
	"listCombined",
] as const;

const SOURCE_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

type RevealStore = Pick<EnhancedStore, "dispatch" | "getState" | "subscribe">;

type RevealControllers = {
	mapControllerName?: string;
	featureSourcesControllerName?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return null;
	}
	return value as Record<string, unknown>;
}

export function sanitizeFeatureSourceId(raw: unknown): string | null {
	if (typeof raw !== "string") {
		return null;
	}
	const id = raw.trim();
	if (!SOURCE_ID_PATTERN.test(id)) {
		return null;
	}
	return id;
}

export function allowlistedFeatureSourceId(
	raw: unknown,
	catalogIds: Iterable<string>,
): string | null {
	const id = sanitizeFeatureSourceId(raw);
	if (!id) {
		return null;
	}
	const catalog =
		catalogIds instanceof Set ? catalogIds : new Set(catalogIds);
	return catalog.has(id) ? id : null;
}

export function parseFeatureSourceSearchParam(
	search: string | undefined | null,
	param = FEATURE_SOURCE_SEARCH_PARAM,
): string | null {
	if (!search) {
		return null;
	}
	const params = new URLSearchParams(
		search.startsWith("?") ? search.slice(1) : search,
	);
	return sanitizeFeatureSourceId(params.get(param));
}

/** `src` to write: known catalog id that is not implied by the landing view. */
export function permalinkSourceId(
	sourceId: string | null | undefined,
	impliedIds?: Iterable<string> | null,
): string | null {
	const id = sanitizeFeatureSourceId(sourceId);
	if (!id) {
		return null;
	}
	if (impliedIds) {
		const implied =
			impliedIds instanceof Set ? impliedIds : new Set(impliedIds);
		if (implied.has(id)) {
			return null;
		}
	}
	return id;
}

export function featureSourceCatalogIds(
	state: unknown,
	controllerName = FEATURE_SOURCES,
): string[] {
	const sources = asRecord(asRecord(state)?.[controllerName]);
	return sources ? Object.keys(sources) : [];
}

export function revealFeatureSource(
	store: RevealStore,
	sourceId: string,
	options: RevealControllers = {},
): boolean {
	const featureSourcesControllerName =
		options.featureSourcesControllerName ?? FEATURE_SOURCES;
	const mapControllerName = options.mapControllerName ?? MAP;
	const allowed = allowlistedFeatureSourceId(
		sourceId,
		featureSourceCatalogIds(store.getState(), featureSourcesControllerName),
	);
	if (!allowed) {
		return false;
	}

	const state = asRecord(store.getState());
	const sources = asRecord(state?.[featureSourcesControllerName]);
	const source = sources?.[allowed];
	const sourceRecord = asRecord(source);
	if (sourceRecord && sourceRecord.type !== "combined") {
		store.dispatch(
			async(load(featureSourcesControllerName, allowed)) as never,
		);
	}

	const mapState = state?.[mapControllerName] as MapState | undefined;
	if (mapState?.layers?.[allowed]) {
		store.dispatch(
			setLayerVisibility(mapControllerName, allowed, true) as never,
		);
	}

	return true;
}

export function revealLayerForFeatureId(
	store: RevealStore,
	featureId: FeatureId | null | undefined,
	options: RevealControllers & {skipIds?: Iterable<string>} = {},
): string | null {
	if (featureId == null || featureId === "") {
		return null;
	}
	const featureSourcesControllerName =
		options.featureSourcesControllerName ?? FEATURE_SOURCES;
	const sources = asRecord(store.getState())?.[
		featureSourcesControllerName
	] as FeatureSourcesState | undefined;
	if (!sources) {
		return null;
	}
	const sourceId = findFeatureSourceIdForFeatureId(sources, featureId, {
		skipIds: options.skipIds ?? PERMALINK_SKIP_FEATURE_SOURCE_IDS,
	});
	if (!sourceId) {
		return null;
	}
	revealFeatureSource(store, sourceId, options);
	return sourceId;
}

/**
 * Load / show `sourceId` when allowlisted, then reveal the owning layer once
 * the feature is in memory. Returns an unsubscribe for the watch.
 */
export function applyFeatureSourceReveal(
	store: RevealStore,
	options: RevealControllers & {
		featureId?: FeatureId | null;
		sourceId?: string | null;
		skipIds?: Iterable<string>;
	},
): () => void {
	if (options.sourceId) {
		revealFeatureSource(store, options.sourceId, options);
	}
	if (revealLayerForFeatureId(store, options.featureId, options)) {
		return () => undefined;
	}
	if (options.featureId == null || options.featureId === "") {
		return () => undefined;
	}

	const featureId = options.featureId;
	const featureSourcesControllerName =
		options.featureSourcesControllerName ?? FEATURE_SOURCES;
	const skipIds = options.skipIds ?? PERMALINK_SKIP_FEATURE_SOURCE_IDS;

	return observeState(
		store as EnhancedStore,
		(state) => {
			const sources = asRecord(state)?.[featureSourcesControllerName] as
				FeatureSourcesState | undefined;
			if (!sources) {
				return null;
			}
			return findFeatureSourceIdForFeatureId(sources, featureId, {
				skipIds,
			});
		},
		(sourceId) => {
			if (sourceId) {
				revealFeatureSource(store, sourceId, options);
				return AbortObserving;
			}
		},
	);
}
