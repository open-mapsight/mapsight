import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import MetricWidgetShell from "./metric-widget-shell.js";

afterEach(cleanup);

describe("MetricWidgetShell", () => {
	it("renders a metric icon as an SVG data URL on the first paint", () => {
		const {container} = render(
			<MetricWidgetShell
				label="Lufttemperatur"
				mapsightIconId="fa-thunderstorm-sun/#2f6d6f/#ffffff"
				showMetricIcons
				lastUpdatedAt={null}
			>
				<span>21 °C</span>
			</MetricWidgetShell>,
		);

		expect(screen.getByText("Lufttemperatur")).toBeTruthy();
		const img = container.querySelector(".ms3-smart-city-metric__icon img");
		expect(img?.getAttribute("src") ?? "").toContain(
			"data:image/svg+xml;charset=utf-8,",
		);
	});
});
