import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {CountAggregatorProvider} from "../../context/count-aggregator-provider.js";
import type {CountAggregatorConfig, PresetData} from "../../types/index.js";
import {PresetSelectItem} from "./preset-select.js";

const config: CountAggregatorConfig = {
	apps: {
		bicycleSensorTotal: {
			id: "bicycleSensorTotal",
			apiBaseUrl: "/mock",
			stationType: "bicycleSensorTotal",
			defaultMetric: "sum",
			defaultResolution: "daily",
		},
	},
	locale: "en",
};

const preset: PresetData = {
	id: 42,
	value: 42,
	name: "My preset",
	mainStationId: 1,
	additionalStationRefs: [],
	additionalDateRanges: [],
};

describe("PresetSelectItem", () => {
	afterEach(() => {
		cleanup();
	});

	it("gives the delete control an accessible name that includes the preset", () => {
		const onDelete = vi.fn();

		render(
			<CountAggregatorProvider config={config}>
				<PresetSelectItem
					preset={preset}
					onDelete={onDelete}
					showDeleteButton
				/>
			</CountAggregatorProvider>,
		);

		expect(
			screen.getByRole("button", {name: /delete preset.*my preset/i}),
		).toBeTruthy();
	});
});
