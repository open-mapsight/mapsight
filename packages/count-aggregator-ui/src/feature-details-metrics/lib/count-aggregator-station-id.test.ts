import {describe, expect, it} from "vitest";

import {toCountAggregatorStationId} from "./count-aggregator-station-id.js";

describe("toCountAggregatorStationId", () => {
	it("strips the msp- prefix", () => {
		expect(toCountAggregatorStationId("msp-111")).toBe("111");
	});

	it("leaves unprefixed ids unchanged", () => {
		expect(toCountAggregatorStationId("184")).toBe("184");
	});
});
