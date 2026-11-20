import {describe, expect, it} from "vitest";

import type {Station} from "../types";
import {
	buildStationLabels,
	formatStationLabel,
	resolveStationLabelParts,
} from "./stations.js";

function createStation(overrides: Partial<Station>): Station {
	return {
		id: 1,
		originId: "fallback-id",
		label: "Station",
		typeName: "Bicycle",
		status: null,
		...overrides,
	};
}

describe("formatStationLabel", () => {
	it("trims trailing metric suffixes", () => {
		expect(
			formatStationLabel(createStation({label: "Main Street (total)"})),
		).toBe("Main Street");
	});

	it("preserves parenthesized text without a preceding space", () => {
		expect(
			formatStationLabel(createStation({label: "Main Street(total)"})),
		).toBe("Main Street(total)");
	});

	it("preserves non-trailing parenthesized text", () => {
		expect(
			formatStationLabel(
				createStation({label: "Main Street (north) counter"}),
			),
		).toBe("Main Street (north) counter");
	});

	it("falls back to the origin id when the display label is empty", () => {
		expect(formatStationLabel(createStation({label: " (total)"}))).toBe(
			"fallback-id",
		);
		expect(formatStationLabel(createStation({label: null}))).toBe(
			"fallback-id",
		);
	});
});

describe("buildStationLabels", () => {
	it("leaves unique names unchanged and disambiguates names after suffix removal", () => {
		const stations = [
			createStation({
				id: 1,
				label: "Shared path (min)",
				sectionDescription: "Upper section",
			}),
			createStation({
				id: 2,
				label: "Shared path (max)",
				sectionDescription: "Lower section",
			}),
			createStation({id: 3, label: "Other path"}),
		];
		expect([...buildStationLabels(stations).values()]).toEqual([
			"Shared path — Upper section",
			"Shared path — Lower section",
			"Other path",
		]);
		expect(buildStationLabels(stations.toReversed())).toEqual(
			buildStationLabels(stations),
		);
	});

	it("uses type, origin id, then numeric id when descriptions are absent or identical", () => {
		const stations = [
			createStation({id: 1, typeName: "Counter", originId: "sensor-a"}),
			createStation({id: 2, typeName: "Level", originId: "sensor-b"}),
		];
		expect([...buildStationLabels(stations).values()]).toEqual([
			"Station — Counter",
			"Station — Level",
		]);
		const sameType = stations.map((station) => ({
			...station,
			typeName: "Counter",
			sectionDescription: "Same section",
		}));
		expect([...buildStationLabels(sameType).values()]).toEqual([
			"Station — sensor-a",
			"Station — sensor-b",
		]);
		expect([
			...buildStationLabels(
				sameType.map((station) => ({...station, originId: "shared"})),
			).values(),
		]).toEqual(["Station — 1", "Station — 2"]);
	});
});

describe("resolveStationLabelParts", () => {
	it("reports which field disambiguates a duplicate name", () => {
		const stations = [
			createStation({id: 1, sectionDescription: " Upper section "}),
			createStation({id: 2, sectionDescription: "Lower section"}),
			createStation({id: 3, label: "Other — Upper section"}),
		];
		expect(resolveStationLabelParts(stations)).toEqual(
			new Map([
				[
					1,
					{
						name: "Station",
						disambiguator: {
							field: "sectionDescription",
							value: "Upper section",
						},
					},
				],
				[
					2,
					{
						name: "Station",
						disambiguator: {
							field: "sectionDescription",
							value: "Lower section",
						},
					},
				],
				[3, {name: "Other — Upper section"}],
			]),
		);
	});
});
