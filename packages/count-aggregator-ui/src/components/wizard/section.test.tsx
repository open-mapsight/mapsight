import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import {CountAggregatorProvider} from "../../context/count-aggregator-provider.js";
import type {CountAggregatorConfig} from "../../types/index.js";
import {Section} from "./section.js";

const config: CountAggregatorConfig = {
	apps: {},
	links: {
		calendarUrl: (dateYmd) => `/calendar/${dateYmd}`,
		eventUrl: (dateYmd, eventId) => `/calendar/${dateYmd}/${eventId}`,
	},
};

describe("Section headings", () => {
	afterEach(cleanup);

	it.each([undefined, "h2"] as const)(
		"uses the configured heading %s and retains the fieldset name",
		(sectionHeadingAs) => {
			render(
				<CountAggregatorProvider config={{...config, sectionHeadingAs}}>
					<Section title="Time range">
						<label>
							Start date <input type="date" />
						</label>
					</Section>
				</CountAggregatorProvider>,
			);

			expect(
				screen.getByRole("heading", {
					name: "Time range",
					level: sectionHeadingAs === "h2" ? 2 : 4,
				}),
			).toBeTruthy();
			expect(
				screen
					.getByRole("group", {name: "Time range"})
					.contains(screen.getByLabelText("Start date")),
			).toBe(true);
		},
	);
});
