import {describe, expect, it} from "vitest";

import {mapsightIconCacheKey} from "./icon-key.ts";

describe("mapsightIconCacheKey", () => {
	it("combines compact id and variant", () => {
		expect(mapsightIconCacheKey("museum/#ff0000", "plain")).toBe(
			"museum/#ff0000|plain",
		);
		expect(mapsightIconCacheKey("museum", undefined)).toBe(
			"museum|default",
		);
	});
});
