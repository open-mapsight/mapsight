import {describe, expect, it} from "vitest";

import {createYAxisUnitLabel} from "./chart-axis-label.js";

describe("createYAxisUnitLabel", () => {
	it("places the unit horizontally at the top of the Y-axis", () => {
		expect(createYAxisUnitLabel("mNN")).toEqual({
			value: "mNN",
			angle: 0,
			position: "top",
			offset: 8,
			style: {
				fontSize: 12,
				textAnchor: "start",
			},
		});
	});
});
