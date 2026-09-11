import merge from "lodash/merge";
import {describe, expect, it} from "vitest";

import {createMemoryFeatureSourceCache} from "@mapsight/core/lib/feature-sources/cache";

import {mergeCreateOptions} from "./merge-create-options";

describe("mergeCreateOptions", () => {
	it("keeps the injected FeatureSourceCache identity through lodash merge", () => {
		const cache = createMemoryFeatureSourceCache();
		const cloned = merge({}, {}, {featureSourceCache: cache});
		expect(cloned.featureSourceCache).not.toBe(cache);

		const merged = mergeCreateOptions({}, {featureSourceCache: cache});
		expect(merged.featureSourceCache).toBe(cache);
	});
});
