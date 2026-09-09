import type {BuildCacheKeyInput} from "@/lib/feature-sources/cache/types";
import {resolveXhrJsonUrl} from "@/lib/feature-sources/loaders/xhr-json-loader";

/**
 * Document identity for xhr-json bodies: resolved URL + revision.
 *
 * Placement ids (`controllerName` / `featureSourceId`) differ per embed; two
 * presets that share one GeoJSON must share one entry. The URL is the fetch
 * target (`resolveXhrJsonUrl`), not the raw config string, so relative paths
 * and SSR `baseUrl` cannot alias two hosts onto one key.
 */
export function buildDocumentCacheKey(input: {
	url: string;
	revision?: string;
}): string {
	const revision = input.revision ?? "";
	return `doc:${revision}:${resolveXhrJsonUrl(input.url)}`;
}

/** True when `key` is a document entry for `url`, any revision. */
export function documentCacheKeyMatchesUrl(key: string, url: string): boolean {
	if (url === "" || !key.startsWith("doc:")) {
		return false;
	}
	return key.endsWith(`:${resolveXhrJsonUrl(url)}`);
}

/**
 * Cache key for a feature source load.
 *
 * When `url` is present (xhr-json), key by document identity so the sidecar
 * warm set and client L1/L2 share one bust protocol. Local / embedded sources
 * without a URL fall back to placement identity.
 */
export function buildCacheKey(input: BuildCacheKeyInput): string {
	if (input.url) {
		return buildDocumentCacheKey({
			url: input.url,
			revision: input.appVersion,
		});
	}

	const revision = input.appVersion ?? "";
	return `src:${revision}:${input.controllerName}:${input.featureSourceId}`;
}
