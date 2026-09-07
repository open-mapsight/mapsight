import {createElement} from "react";

import {afterEach, describe, expect, it, vi} from "vitest";

import {mountSmartCityMetrics} from "./index.js";

vi.mock("./components/smart-city-metric-widget.js", () => ({
	default: function MockSmartCityMetricWidget() {
		return createElement(
			"div",
			{
				className: "ms3-smart-city-metric",
				"data-testid": "metric-widget",
			},
			"widget",
		);
	},
}));

const PLACEHOLDER_HTML =
	'<div class="js-ms3-smart-city-metric" data-ms3-station-type="weatherTemp" data-ms3-station-id="1" data-ms3-station-label="Temperatur"></div>';

afterEach(() => {
	mountSmartCityMetrics(null);
});

describe("mountSmartCityMetrics", () => {
	it("remounts widgets after the host replaces placeholder HTML", async () => {
		const container = document.createElement("div");
		container.innerHTML = PLACEHOLDER_HTML;
		document.body.append(container);

		mountSmartCityMetrics(container);
		await vi.waitFor(() => {
			expect(
				container.querySelector("[data-testid=metric-widget]"),
			).toBeTruthy();
		});

		container.innerHTML = PLACEHOLDER_HTML;
		expect(
			container.querySelector("[data-testid=metric-widget]"),
		).toBeNull();

		mountSmartCityMetrics(container);
		await vi.waitFor(() => {
			expect(
				container.querySelector("[data-testid=metric-widget]"),
			).toBeTruthy();
		});

		container.remove();
	});
});
