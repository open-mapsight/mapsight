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
};

const locationBaseUrl = (() => {
	if (typeof window === "undefined" || !window.location) {
		return undefined;
	}
	return window.location.href;
})();

function createHttpError(status: number, statusText: string) {
	const detail = statusText.trim();
	return new Error(detail ? `HTTP ${status} ${detail}` : `HTTP ${status}`);
}

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

function readHeader(
	headers: {get(name: string): string | null} | undefined,
	name: string,
): string | undefined {
	const value = headers?.get(name);
	return value && value.trim() !== "" ? value : undefined;
}

export async function fetchXhrJson(
	url: string,
	conditional: XhrJsonConditionalRequest = {},
): Promise<XhrJsonFetchResult> {
	const headers: Record<string, string> = {};
	if (conditional.ifNoneMatch) {
		headers["If-None-Match"] = conditional.ifNoneMatch;
	}
	if (conditional.ifModifiedSince) {
		headers["If-Modified-Since"] = conditional.ifModifiedSince;
	}

	const response = await fetch(resolveXhrJsonUrl(url), {
		redirect: "follow",
		headers,
	});

	const meta = {
		status: response.status,
		etag: readHeader(response.headers, "ETag"),
		lastModified: readHeader(response.headers, "Last-Modified"),
		cacheControl: readHeader(response.headers, "Cache-Control"),
		expires: readHeader(response.headers, "Expires"),
	};

	if (response.status === 304) {
		return {...meta, notModified: true};
	}

	if (!response.ok) {
		throw createHttpError(response.status, response.statusText);
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
