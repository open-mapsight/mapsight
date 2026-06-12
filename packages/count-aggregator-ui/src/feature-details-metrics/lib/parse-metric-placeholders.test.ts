import {describe, expect, it} from "vitest";

import {parseMetricPlaceholder} from "./parse-metric-placeholders.js";

describe("parseMetricPlaceholder", () => {
	it("reads optional mapsight icon id", () => {
		const element = document.createElement("div");
		element.setAttribute("data-ms3-station-type", "weatherTemp");
		element.setAttribute("data-ms3-station-id", "111");
		element.setAttribute("data-ms3-station-label", "Temperatur");
		element.setAttribute(
			"data-ms3-mapsight-icon-id",
			"fa-leaf-heart/#2f6d6f/#ffffff",
		);

		expect(parseMetricPlaceholder(element)).toEqual({
			stationType: "weatherTemp",
			stationId: "111",
			label: "Temperatur",
			mapsightIconId: "fa-leaf-heart/#2f6d6f/#ffffff",
		});
	});
});
