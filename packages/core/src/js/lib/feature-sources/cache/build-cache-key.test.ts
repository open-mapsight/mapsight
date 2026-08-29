import {describe, expect, it} from "vitest";

import {buildCacheKey, buildDocumentCacheKey} from "./build-cache-key";

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
				url: "/geojson/schools.geojson",
			}),
		).toBe("doc::/geojson/schools.geojson");
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
