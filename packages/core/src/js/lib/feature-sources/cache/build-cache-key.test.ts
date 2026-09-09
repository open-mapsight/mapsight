import {describe, expect, it} from "vitest";

import {resolveXhrJsonUrl} from "@/lib/feature-sources/loaders/xhr-json-loader";

import {
	buildCacheKey,
	buildDocumentCacheKey,
	documentCacheKeyMatchesUrl,
} from "./build-cache-key";

describe("buildDocumentCacheKey", () => {
	it("keys by url and revision so placements share one document", () => {
		expect(
			buildDocumentCacheKey({
				url: "https://example.test/geojson/schools.geojson",
				revision: "pub-12",
			}),
		).toBe("doc:pub-12:https://example.test/geojson/schools.geojson");
	});

	it("omits revision when unset", () => {
		expect(
			buildDocumentCacheKey({
				url: "https://example.test/geojson/schools.geojson",
			}),
		).toBe("doc::https://example.test/geojson/schools.geojson");
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
		).toBe("src:v2:featureSources:userGeolocation");
	});
});
