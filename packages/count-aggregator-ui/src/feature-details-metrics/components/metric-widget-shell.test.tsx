import {uiIconSrc} from "@mapsight/traffic-style/icon";
import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import MetricWidgetShell from "./metric-widget-shell.js";

const METRIC_ICON_ID = "fa-thunderstorm-sun/#2f6d6f/#ffffff";

afterEach(cleanup);

describe("MetricWidgetShell", () => {
	it("renders a metric icon as an SVG data URL on the first paint", () => {
		const {container} = render(
			<MetricWidgetShell
				label="Lufttemperatur"
				mapsightIconId={METRIC_ICON_ID}
				showMetricIcons
				lastUpdatedAt={null}
			>
				<span>21 °C</span>
			</MetricWidgetShell>,
		);

		expect(screen.getByText("Lufttemperatur")).toBeTruthy();
		const img = container.querySelector(".ms3-smart-city-metric__icon img");
		const expected = uiIconSrc(METRIC_ICON_ID, "plain")?.src;
		expect(expected).toBeTruthy();
		expect(expected).not.toBe(
			uiIconSrc("marker/#2f6d6f/#ffffff", "plain")?.src,
		);
		expect(img?.getAttribute("src")).toBe(expected);
	});
});
