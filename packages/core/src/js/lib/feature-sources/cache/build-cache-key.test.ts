import {describe, expect, it} from "vitest";

import {resolveXhrJsonUrl} from "@/lib/feature-sources/loaders/xhr-json-loader";

import {
	buildCacheKey,
	buildDocumentCacheKey,
	documentCacheKeyMatchesUrl,
} from "./build-cache-key";

describe("buildDocumentCacheKey", () => {
	it("keys by url and revision so placements share one document", () => {
		const url = "https://example.test/geojson/schools.geojson";
		expect(
			buildDocumentCacheKey({
				url,
				revision: "pub-12",
			}),
		).toBe(`doc:pub-12:${encodeURIComponent(url)}`);
	});

	it("omits revision when unset", () => {
		const url = "https://example.test/geojson/schools.geojson";
		expect(buildDocumentCacheKey({url})).toBe(
			`doc:${encodeURIComponent("")}:${encodeURIComponent(url)}`,
		);
	});

	it("does not collide when revision text looks like a URL prefix", () => {
		expect(
			buildDocumentCacheKey({
				url: "https://example.com/b",
				revision: "r:https://example.com/a",
			}),
		).not.toBe(
			buildDocumentCacheKey({
				url: "https://example.com/a:https://example.com/b",
				revision: "r",
			}),
		);
	});

	it("resolves relative urls the same way the loader fetches", () => {
		const relative = "/geojson/schools.geojson";
		const resolved = resolveXhrJsonUrl(relative);
		expect(buildDocumentCacheKey({url: relative})).toBe(
			buildDocumentCacheKey({url: resolved}),
		);
		expect(
			documentCacheKeyMatchesUrl(
				buildDocumentCacheKey({url: relative, revision: "pub-12"}),
				resolved,
			),
		).toBe(true);
		expect(buildDocumentCacheKey({url: relative})).not.toBe(
			buildDocumentCacheKey({
				url: "https://other.test/geojson/schools.geojson",
			}),
		);
	});

	it("matches a document key for the same url under any revision", () => {
		const url = "https://example.test/geojson/schools.geojson";
		expect(
			documentCacheKeyMatchesUrl(
				buildDocumentCacheKey({url, revision: "pub-12"}),
				url,
			),
		).toBe(true);
		expect(
			documentCacheKeyMatchesUrl(buildDocumentCacheKey({url}), url),
		).toBe(true);
		expect(
			documentCacheKeyMatchesUrl(
				buildDocumentCacheKey({
					url: "https://example.test/geojson/other.geojson",
				}),
				url,
			),
		).toBe(false);
		expect(
			documentCacheKeyMatchesUrl("src:v1:featureSources:schools", url),
		).toBe(false);
	});
});

describe("buildCacheKey", () => {
	it("uses document identity when a url is present", () => {
		expect(
			buildCacheKey({
				controllerName: "featureSources",
				featureSourceId: "schools-a",
				url: "/geojson/schools.geojson",
				appVersion: "v2",
			}),
		).toBe(
			buildCacheKey({
				controllerName: "otherSources",
				featureSourceId: "schools-b",
				url: "/geojson/schools.geojson",
				appVersion: "v2",
			}),
		);
	});

	it("uses placement identity when there is no url", () => {
		expect(
			buildCacheKey({
				controllerName: "featureSources",
				featureSourceId: "userGeolocation",
				appVersion: "v2",
			}),
		).toBe(
			`src:${encodeURIComponent("v2")}:${encodeURIComponent("featureSources")}:${encodeURIComponent("userGeolocation")}`,
		);
	});

	it("does not collide when placement key components contain colons", () => {
		expect(
			buildCacheKey({
				controllerName: "c",
				featureSourceId: "d",
				appVersion: "a:b",
			}),
		).not.toBe(
			buildCacheKey({
				controllerName: "b:c",
				featureSourceId: "d",
				appVersion: "a",
			}),
		);
	});
});
