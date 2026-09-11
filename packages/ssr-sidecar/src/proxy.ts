/**
 * Node fetch ignores HTTP_PROXY unless a dispatcher is installed.
 * `http.setGlobalProxyFromEnv` is Node's hook for that (sets the undici
 * global dispatcher). Call before any outbound fetch, including the
 * MAPSIGHT_SSR_MODULE import.
 */
import http from "node:http";

type HttpWithEnvProxy = typeof http & {
	setGlobalProxyFromEnv?: (env: NodeJS.ProcessEnv) => void;
};

export function proxyUrlFromEnv(
	env: NodeJS.ProcessEnv = process.env,
): string | undefined {
	const value =
		env.HTTPS_PROXY ?? env.https_proxy ?? env.HTTP_PROXY ?? env.http_proxy;
	if (typeof value !== "string") {
		return undefined;
	}
	const trimmed = value.trim();
	return trimmed === "" ? undefined : trimmed;
}

export function httpOriginHostsFromEnv(
	env: NodeJS.ProcessEnv = process.env,
): string[] {
	const raw = env.MAPSIGHT_SSR_HTTP_ORIGINS;
	if (typeof raw !== "string" || raw.trim() === "") {
		return [];
	}
	return raw
		.split(",")
		.map((host) => host.trim().toLowerCase())
		.filter((host) => host !== "");
}

export function rewriteHttpsToHttpOrigin(
	href: string,
	httpHosts: string[],
): string {
	if (httpHosts.length === 0) {
		return href;
	}
	let url: URL;
	try {
		url = new URL(href);
	} catch {
		return href;
	}
	if (url.protocol !== "https:") {
		return href;
	}
	if (!httpHosts.includes(url.hostname.toLowerCase())) {
		return href;
	}
	url.protocol = "http:";
	return url.href;
}

export function installEnvHttpProxyDispatcher(
	env: NodeJS.ProcessEnv = process.env,
): string | undefined {
	const proxyUrl = proxyUrlFromEnv(env);
	if (proxyUrl === undefined) {
		return undefined;
	}
	const setGlobalProxyFromEnv = (http as HttpWithEnvProxy)
		.setGlobalProxyFromEnv;
	if (typeof setGlobalProxyFromEnv !== "function") {
		throw new Error(
			"HTTP_PROXY is set but this Node build has no http.setGlobalProxyFromEnv; use Node 24.19+ or node --use-env-proxy",
		);
	}
	setGlobalProxyFromEnv({
		HTTP_PROXY: env.HTTP_PROXY ?? env.http_proxy ?? proxyUrl,
		HTTPS_PROXY: env.HTTPS_PROXY ?? env.https_proxy ?? proxyUrl,
		NO_PROXY: env.NO_PROXY ?? env.no_proxy,
		http_proxy: env.http_proxy ?? env.HTTP_PROXY ?? proxyUrl,
		https_proxy: env.https_proxy ?? env.HTTPS_PROXY ?? proxyUrl,
		no_proxy: env.no_proxy ?? env.NO_PROXY,
	});
	return proxyUrl;
}

export function installHttpsOriginRewrite(
	env: NodeJS.ProcessEnv = process.env,
): string[] {
	const httpHosts = httpOriginHostsFromEnv(env);
	if (httpHosts.length === 0) {
		return [];
	}
	const originalFetch = globalThis.fetch;
	globalThis.fetch = function mapsightSsrFetch(
		input: Parameters<typeof fetch>[0],
		init?: Parameters<typeof fetch>[1],
	): Promise<Response> {
		const href = requestHref(input);
		if (href === undefined) {
			return originalFetch(input, init);
		}
		const rewritten = rewriteHttpsToHttpOrigin(href, httpHosts);
		if (rewritten === href) {
			return originalFetch(input, init);
		}
		if (typeof input === "string" || input instanceof URL) {
			return originalFetch(rewritten, init);
		}
		return originalFetch(new Request(rewritten, input), init);
	};
	return httpHosts;
}

function requestHref(input: Parameters<typeof fetch>[0]): string | undefined {
	if (typeof input === "string") {
		return input;
	}
	if (input instanceof URL) {
		return input.href;
	}
	if (typeof Request !== "undefined" && input instanceof Request) {
		return input.url;
	}
	return undefined;
}
