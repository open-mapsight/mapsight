import {correctedInitialAgeSec} from "@/lib/feature-sources/cache/http-freshness";
import type {FeatureSourceData} from "@/lib/feature-sources/types";

export type XhrJsonLoaderState = {
	url?: string;
};

export type XhrJsonConditionalRequest = {
	ifNoneMatch?: string;
	ifModifiedSince?: string;
};

export type XhrJsonFetchResult = {
	status: number;
	notModified: boolean;
	data?: FeatureSourceData;
	etag?: string;
	lastModified?: string;
	cacheControl?: string;
	expires?: string;
	age?: string;
	date?: string;
	ageSec: number;
	/** Response-header time; cache writers must not replace this with a later Date.now(). */
	fetchedAt: number;
};

export class XhrJsonHttpError extends Error {
	readonly status: number;

	constructor(status: number, statusText: string) {
		const detail = statusText.trim();
		super(detail ? `HTTP ${status} ${detail}` : `HTTP ${status}`);
		this.name = "XhrJsonHttpError";
		this.status = status;
	}
}

/** RFC 5861 stale-if-error: 5xx or a failure that is not an HTTP status. */
export function allowsStaleIfErrorForFailure(error: unknown): boolean {
	if (error instanceof XhrJsonHttpError) {
		return error.status >= 500 && error.status <= 599;
	}
	return true;
}

const locationBaseUrl = (() => {
	if (typeof window === "undefined" || !window.location) {
		return undefined;
	}
	return window.location.href;
})();

export function resolveXhrJsonUrl(url: string): string {
	return new URL(
		url,
		(typeof global !== "undefined" &&
			"baseUrl" in global &&
			typeof global.baseUrl === "string" &&
			global.baseUrl) ||
			locationBaseUrl ||
			"http://localhost/",
	).href;
}

function maySendConditionalHeaders(url: string): boolean {
	if (typeof window === "undefined" || !window.location) {
		return true;
	}
	try {
		return (
			new URL(resolveXhrJsonUrl(url)).origin === window.location.origin
		);
	} catch {
		return false;
	}
}

function readHeader(
	headers: {get(name: string): string | null} | undefined,
	name: string,
): string | undefined {
	const value = headers?.get(name)?.trim();
	return value ? value : undefined;
}

export async function fetchXhrJson(
	url: string,
	conditional: XhrJsonConditionalRequest = {},
): Promise<XhrJsonFetchResult> {
	const headers: Record<string, string> = {};
	if (maySendConditionalHeaders(url)) {
		if (conditional.ifNoneMatch) {
			headers["If-None-Match"] = conditional.ifNoneMatch;
		}
		if (conditional.ifModifiedSince) {
			headers["If-Modified-Since"] = conditional.ifModifiedSince;
		}
	}

	const requestTime = Date.now();
	const response = await fetch(resolveXhrJsonUrl(url), {
		redirect: "follow",
		headers,
	});
	const responseTime = Date.now();
	const age = readHeader(response.headers, "Age");
	const date = readHeader(response.headers, "Date");

	const meta = {
		status: response.status,
		etag: readHeader(response.headers, "ETag"),
		lastModified: readHeader(response.headers, "Last-Modified"),
		cacheControl: readHeader(response.headers, "Cache-Control"),
		expires: readHeader(response.headers, "Expires"),
		age,
		date,
		ageSec: correctedInitialAgeSec({
			ageHeader: age,
			dateHeader: date,
			requestTime,
			responseTime,
		}),
		fetchedAt: responseTime,
	};

	if (response.status === 304) {
		return {...meta, notModified: true};
	}

	if (!response.ok) {
		throw new XhrJsonHttpError(response.status, response.statusText);
	}

	return {
		...meta,
		notModified: false,
		data: (await response.json()) as FeatureSourceData | undefined,
	};
}

export async function load(
	state: XhrJsonLoaderState,
): Promise<FeatureSourceData | undefined> {
	if (!state.url) {
		throw new Error("url missing");
	}

	const result = await fetchXhrJson(state.url);
	return result.data;
}
