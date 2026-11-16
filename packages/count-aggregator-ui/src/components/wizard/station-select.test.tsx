import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import {CountAggregatorProvider} from "../../context/count-aggregator-provider.js";
import type {Station} from "../../types";
import {StationSelect} from "./station-select.js";

const stations = new Map<number, Station>(
	[1, 2, 3].map((id) => [
		id,
		{
			id,
			originId: `sensor-${id}`,
			label: "Shared path",
			typeName: "Counter",
			status: null,
			sectionDescription:
				id === 3
					? "Upper section"
					: id === 1
						? "Upper section"
						: "Lower section",
		},
	]),
);
afterEach(cleanup);

const config = {
	apps: {},
	links: {calendarUrl: () => "", eventUrl: () => ""},
	locale: "en" as const,
};

describe("StationSelect", () => {
	it("disambiguates selected chips even when descriptions are hidden", () => {
		render(
			<CountAggregatorProvider config={config}>
				<StationSelect
					stationsById={stations}
					stationIds={[1, 2]}
					onChange={() => {}}
					isMulti
					showDescriptionInSelection={false}
				/>
			</CountAggregatorProvider>,
		);
		expect(screen.getByText("Shared path — sensor-1")).toBeTruthy();
		expect(screen.getByText("Shared path — sensor-2")).toBeTruthy();
	});

	it("uses the same labels in the menu and permits searching by the disambiguator", () => {
		render(
			<CountAggregatorProvider config={config}>
				<StationSelect
					stationsById={stations}
					stationIds={[]}
					onChange={() => {}}
				/>
			</CountAggregatorProvider>,
		);
		fireEvent.change(screen.getByRole("combobox"), {
			target: {value: "sensor-2"},
		});
		expect(screen.getByRole("option").textContent).toContain(
			"Shared path — sensor-2",
		);
		expect(screen.queryByText("Shared path — sensor-1")).toBeNull();
	});
});
