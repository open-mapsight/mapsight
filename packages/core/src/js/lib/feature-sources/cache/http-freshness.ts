/**
 * HTTP freshness for cached xhr-json documents (RFC 9111 + RFC 5861).
 *
 * `stale-while-revalidate`: serve the stored body now, revalidate in the background.
 * The opposite is `must-revalidate` / `proxy-revalidate` / `no-cache`: do not
 * serve stale until origin confirms (304) or replaces (200).
 *
 * Duplicate `Cache-Control` directives use the first occurrence (RFC 9111
 * §4.2.1). Invalid delta-seconds are stale (0). `Pragma: no-cache` applies only
 * when `Cache-Control` is absent. `immutable` may reuse until `maxMs`.
 */

export type CacheControlDirectives = {
	maxAgeSec?: number;
	sMaxAgeSec?: number;
	staleWhileRevalidateSec?: number;
	staleIfErrorSec?: number;
	mustRevalidate: boolean;
	proxyRevalidate: boolean;
	noCache: boolean;
	noStore: boolean;
	immutable: boolean;
	isPrivate: boolean;
};

export type FreshnessDecision =
	"fresh" | "stale-while-revalidate" | "must-revalidate" | "stale";

export type CacheTtlPolicy = {
	/** Do not persist if origin freshness is shorter than this. */
	minMs: number;
	/** Freshness when the response has no max-age / Expires. */
	defaultMs: number;
	/** Never treat a stored document as fresh longer than this. */
	maxMs: number;
};

/** Municipal xhr-json: worth keeping, not forever, not sub-second churn. */
export const DEFAULT_CACHE_TTL: CacheTtlPolicy = {
	minMs: 10_000,
	defaultMs: 5 * 60 * 1000,
	maxMs: 60 * 60 * 1000,
};

export function resolveCacheTtlPolicy(
	overrides?: Partial<CacheTtlPolicy>,
): CacheTtlPolicy {
	const minMs = overrides?.minMs ?? DEFAULT_CACHE_TTL.minMs;
	const maxMs = Math.max(minMs, overrides?.maxMs ?? DEFAULT_CACHE_TTL.maxMs);
	const defaultMs = Math.min(
		maxMs,
		Math.max(minMs, overrides?.defaultMs ?? DEFAULT_CACHE_TTL.defaultMs),
	);
	return {minMs, defaultMs, maxMs};
}

export type FreshnessInput = {
	fetchedAt: number;
	/** Corrected initial age at fetch (RFC 9111 Age / Date). */
	ageSec?: number;
	cacheControl?: string;
	/** Used only when `cacheControl` is omitted (RFC 9111 `Pragma`). */
	pragma?: string;
	expires?: string;
	/** HTTP Date of the stored response; used with Expires. */
	date?: string;
	now?: number;
	/** Shared caches (SSR sidecar) honor `s-maxage` and `proxy-revalidate`. */
	shared?: boolean;
	ttl?: Partial<CacheTtlPolicy>;
};

/**
 * RFC 9111: `Pragma: no-cache` is equivalent to `Cache-Control: no-cache` only
 * when `Cache-Control` is not present.
 */
export function cacheControlFromHeaders(input: {
	cacheControl?: string;
	pragma?: string;
}): string | undefined {
	if (input.cacheControl !== undefined) {
		return input.cacheControl;
	}
	if (input.pragma && /(?:^|,)\s*no-cache\s*(?:,|$)/i.test(input.pragma)) {
		return "no-cache";
	}
	return undefined;
}

function parseDeltaSeconds(value: string | undefined): number | undefined {
	if (value === undefined || !/^\d+$/.test(value)) {
		return undefined;
	}
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function parseCacheControl(
	header: string | undefined,
): CacheControlDirectives {
	const directives: CacheControlDirectives = {
		mustRevalidate: false,
		proxyRevalidate: false,
		noCache: false,
		noStore: false,
		immutable: false,
		isPrivate: false,
	};
	if (!header) {
		return directives;
	}

	for (const part of header.split(",")) {
		const trimmed = part.trim();
		if (trimmed === "") {
			continue;
		}
		const eq = trimmed.indexOf("=");
		const name = (eq === -1 ? trimmed : trimmed.slice(0, eq))
			.trim()
			.toLowerCase();
		const raw = eq === -1 ? undefined : trimmed.slice(eq + 1).trim();
		const value = raw?.replace(/^"(.*)"$/, "$1");

		switch (name) {
			case "max-age":
				directives.maxAgeSec = firstDelta(directives.maxAgeSec, value);
				break;
			case "s-maxage":
				directives.sMaxAgeSec = firstDelta(
					directives.sMaxAgeSec,
					value,
				);
				break;
			case "stale-while-revalidate":
				directives.staleWhileRevalidateSec = firstDelta(
					directives.staleWhileRevalidateSec,
					value,
				);
				break;
			case "stale-if-error":
				directives.staleIfErrorSec = firstDelta(
					directives.staleIfErrorSec,
					value,
				);
				break;
			case "must-revalidate":
				directives.mustRevalidate = true;
				break;
			case "proxy-revalidate":
				directives.proxyRevalidate = true;
				break;
			case "no-cache":
				directives.noCache = true;
				break;
			case "no-store":
				directives.noStore = true;
				break;
			case "immutable":
				directives.immutable = true;
				break;
			case "private":
				directives.isPrivate = true;
				break;
			default:
				break;
		}
	}

	return directives;
}

/**
 * RFC 9111 corrected initial age:
 * max(apparent_age, Age + response_delay).
 */
function parseAgeHeader(value: string | undefined): number {
	if (!value) {
		return 0;
	}
	const first = value.split(",")[0]?.trim();
	return parseDeltaSeconds(first) ?? 0;
}

function firstDelta(
	current: number | undefined,
	raw: string | undefined,
): number {
	return current ?? parseDeltaSeconds(raw) ?? 0;
}

function directivesFrom(input: {
	cacheControl?: string;
	pragma?: string;
}): CacheControlDirectives {
	return parseCacheControl(cacheControlFromHeaders(input));
}

function isUnusableStoredResponse(
	directives: CacheControlDirectives,
	shared: boolean,
): boolean {
	return directives.noStore || (shared && directives.isPrivate);
}

export function correctedInitialAgeSec(input: {
	ageHeader?: string;
	dateHeader?: string;
	now?: number;
	requestTime?: number;
	responseTime?: number;
}): number {
	const responseTime = input.responseTime ?? input.now ?? Date.now();
	const ageHeaderSec = parseAgeHeader(input.ageHeader);
	const responseDelaySec =
		input.requestTime === undefined
			? 0
			: Math.max(0, (responseTime - input.requestTime) / 1000);
	const correctedAgeValue = ageHeaderSec + responseDelaySec;
	if (!input.dateHeader) {
		return Math.floor(correctedAgeValue);
	}
	const dateAt = Date.parse(input.dateHeader);
	if (!Number.isFinite(dateAt)) {
		return Math.floor(correctedAgeValue);
	}
	const apparentAgeSec = Math.max(
		0,
		Math.floor((responseTime - dateAt) / 1000),
	);
	return Math.max(apparentAgeSec, Math.floor(correctedAgeValue));
}

function currentAgeSec(fetchedAt: number, ageSec: number, now: number): number {
	return Math.max(0, (now - fetchedAt) / 1000) + Math.max(0, ageSec);
}

function freshnessLifetimeSec(
	directives: CacheControlDirectives,
	expires: string | undefined,
	fetchedAt: number,
	shared: boolean,
	dateHeader?: string,
): number | undefined {
	if (shared && directives.sMaxAgeSec !== undefined) {
		return directives.sMaxAgeSec;
	}
	if (directives.maxAgeSec !== undefined) {
		return directives.maxAgeSec;
	}
	if (!expires) {
		return undefined;
	}
	const expiresAt = Date.parse(expires);
	if (!Number.isFinite(expiresAt)) {
		return 0;
	}
	// RFC 9111: a missing Date is the receipt time, not receipt minus Age.
	const dateAt = dateHeader ? Date.parse(dateHeader) : fetchedAt;
	if (!Number.isFinite(dateAt)) {
		return 0;
	}
	return Math.max(0, Math.floor((expiresAt - dateAt) / 1000));
}

/**
 * Whether a response is worth keeping. Skip `no-store`, `private` on shared
 * caches, and documents whose origin lifetime is shorter than `minMs`.
 * `no-cache` is stored and revalidated (`evaluateFreshness`); it is not
 * `no-store`.
 */
export function shouldPersistDocumentCache(input: {
	cacheControl?: string;
	pragma?: string;
	expires?: string;
	fetchedAt?: number;
	date?: string;
	ageSec?: number;
	shared?: boolean;
	ttl?: Partial<CacheTtlPolicy>;
}): boolean {
	const ttl = resolveCacheTtlPolicy(input.ttl);
	const directives = directivesFrom(input);
	if (isUnusableStoredResponse(directives, input.shared ?? false)) {
		return false;
	}
	if (directives.noCache) {
		return true;
	}
	const lifetimeSec = freshnessLifetimeSec(
		directives,
		input.expires,
		input.fetchedAt ?? Date.now(),
		input.shared ?? false,
		input.date,
	);
	if (lifetimeSec === undefined) {
		return true;
	}
	return lifetimeSec * 1000 >= ttl.minMs;
}

/**
 * Whether concurrent waiters on a shared cache may observe this response.
 * `no-store` and shared `private` are not stored; they must not be handed to
 * other SSR renders through in-flight coalescing either.
 */
export function isShareableCachedResponse(input: {
	cacheControl?: string;
	shared?: boolean;
}): boolean {
	if (!(input.shared ?? false)) {
		return true;
	}
	return canServeDocumentCacheEntry({...input, shared: true});
}

/** Stored entries that must not be served for this cache policy. */
export function canServeDocumentCacheEntry(input: {
	cacheControl?: string;
	shared?: boolean;
}): boolean {
	return !isUnusableStoredResponse(
		parseCacheControl(input.cacheControl),
		input.shared ?? false,
	);
}

function effectiveFreshnessLifetimeSec(
	originLifetimeSec: number | undefined,
	ttl: CacheTtlPolicy,
	immutable: boolean,
): number {
	if (originLifetimeSec === undefined) {
		return (immutable ? ttl.maxMs : ttl.defaultMs) / 1000;
	}
	return Math.min(originLifetimeSec, ttl.maxMs / 1000);
}

function resolveFreshness(input: FreshnessInput): {
	shared: boolean;
	ttl: CacheTtlPolicy;
	directives: CacheControlDirectives;
	ageSec: number;
	lifetime: number;
} {
	const shared = input.shared ?? false;
	const ttl = resolveCacheTtlPolicy(input.ttl);
	const directives = directivesFrom(input);
	const originLifetime = freshnessLifetimeSec(
		directives,
		input.expires,
		input.fetchedAt,
		shared,
		input.date,
	);
	return {
		shared,
		ttl,
		directives,
		ageSec: currentAgeSec(
			input.fetchedAt,
			input.ageSec ?? 0,
			input.now ?? Date.now(),
		),
		lifetime: effectiveFreshnessLifetimeSec(
			originLifetime,
			ttl,
			directives.immutable,
		),
	};
}

/**
 * Decide whether a stored document may be returned without waiting on origin.
 *
 * Missing freshness headers use `defaultMs`, then cap at `maxMs`.
 * Origins that want a check every time send `no-cache`.
 * `must-revalidate` / `proxy-revalidate` apply once that lifetime is exceeded.
 */
export function evaluateFreshness(input: FreshnessInput): FreshnessDecision {
	const {shared, ttl, directives, ageSec, lifetime} = resolveFreshness(input);
	if (isUnusableStoredResponse(directives, shared) || directives.noCache) {
		return "must-revalidate";
	}
	if (ageSec < lifetime) {
		return "fresh";
	}

	const mustRevalidate =
		directives.mustRevalidate ||
		(shared &&
			(directives.proxyRevalidate ||
				directives.sMaxAgeSec !== undefined));
	if (mustRevalidate) {
		return "must-revalidate";
	}

	const swr = directives.staleWhileRevalidateSec;
	if (
		swr !== undefined &&
		ageSec < lifetime + Math.min(swr, ttl.maxMs / 1000)
	) {
		return "stale-while-revalidate";
	}

	return "stale";
}

export function allowsStaleOnError(input: FreshnessInput): boolean {
	const {shared, directives, ageSec, lifetime} = resolveFreshness(input);
	if (directives.staleIfErrorSec === undefined) {
		return false;
	}
	if (isUnusableStoredResponse(directives, shared) || directives.noCache) {
		return false;
	}
	return ageSec < lifetime + directives.staleIfErrorSec;
}
