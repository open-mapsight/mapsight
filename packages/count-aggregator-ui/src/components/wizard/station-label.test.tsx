import {cleanup, render} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import {resolveStationLabelParts} from "../../lib/stations.js";
import type {Station} from "../../types";
import {StationLabel} from "./station-label.js";

afterEach(cleanup);

function station(id: number, overrides: Partial<Station> = {}): Station {
	return {
		id,
		originId: `sensor-${id}`,
		label: "Shared path",
		typeName: "Counter",
		status: null,
		...overrides,
	};
}

function renderLabel(stations: Station[], id: number) {
	const labels = resolveStationLabelParts(stations);
	return render(
		<StationLabel
			station={stations.find((entry) => entry.id === id)}
			label={labels.get(id)}
			color="#000"
		/>,
	).container.textContent;
}

describe("StationLabel", () => {
	it("shows a disambiguating section description once, as description text", () => {
		const stations = [
			station(1, {sectionDescription: "Upper section"}),
			station(2, {sectionDescription: "Lower section"}),
		];
		expect(renderLabel(stations, 1)).toBe("Shared pathUpper section");
	});

	it("appends other disambiguators and keeps the description", () => {
		const stations = [
			station(1, {sectionDescription: "Same section"}),
			station(2, {sectionDescription: "Same section"}),
		];
		expect(renderLabel(stations, 2)).toBe(
			"Shared path — sensor-2Same section",
		);
	});

	it("keeps the description when a unique name already ends with it", () => {
		const stations = [
			station(1, {
				label: "Path — Upper section",
				sectionDescription: "Upper section",
			}),
		];
		expect(renderLabel(stations, 1)).toBe(
			"Path — Upper sectionUpper section",
		);
	});
});
