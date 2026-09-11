import {describe, expect, it} from "vitest";

import {
	httpOriginHostsFromEnv,
	installEnvHttpProxyDispatcher,
	proxyUrlFromEnv,
	rewriteHttpsToHttpOrigin,
} from "./proxy.ts";

describe("proxyUrlFromEnv", () => {
	it("prefers HTTPS_PROXY then HTTP_PROXY", () => {
		expect(
			proxyUrlFromEnv({
				HTTPS_PROXY: "http://proxy.example:8080/",
				HTTP_PROXY: "http://other.example:8080/",
			}),
		).toBe("http://proxy.example:8080/");
		expect(
			proxyUrlFromEnv({http_proxy: "http://legacy.example:8080/"}),
		).toBe("http://legacy.example:8080/");
		expect(proxyUrlFromEnv({HTTP_PROXY: "  "})).toBeUndefined();
		expect(proxyUrlFromEnv({})).toBeUndefined();
	});
});

describe("rewriteHttpsToHttpOrigin", () => {
	it("only rewrites listed https hosts", () => {
		const hosts = ["maps.example.test"];
		expect(
			rewriteHttpsToHttpOrigin(
				"https://maps.example.test/geojson/sights.geojson",
				hosts,
			),
		).toBe("http://maps.example.test/geojson/sights.geojson");
		expect(
			rewriteHttpsToHttpOrigin(
				"https://other.example.test/a.geojson",
				hosts,
			),
		).toBe("https://other.example.test/a.geojson");
		expect(
			rewriteHttpsToHttpOrigin(
				"http://maps.example.test/geojson/sights.geojson",
				hosts,
			),
		).toBe("http://maps.example.test/geojson/sights.geojson");
		expect(rewriteHttpsToHttpOrigin("/geojson/a.geojson", hosts)).toBe(
			"/geojson/a.geojson",
		);
	});
});

describe("httpOriginHostsFromEnv", () => {
	it("splits MAPSIGHT_SSR_HTTP_ORIGINS", () => {
		expect(httpOriginHostsFromEnv({})).toEqual([]);
		expect(
			httpOriginHostsFromEnv({
				MAPSIGHT_SSR_HTTP_ORIGINS: "maps.example.test, Other.EXAMPLE",
			}),
		).toEqual(["maps.example.test", "other.example"]);
	});
});

describe("installEnvHttpProxyDispatcher", () => {
	it("is a no-op without proxy env", () => {
		expect(installEnvHttpProxyDispatcher({})).toBeUndefined();
	});
});
