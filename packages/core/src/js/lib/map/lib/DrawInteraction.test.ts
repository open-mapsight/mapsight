import OlFeature from "ol/Feature";
import OlMap from "ol/Map";
import View from "ol/View";
import LineString from "ol/geom/LineString";
import {DrawEvent} from "ol/interaction/Draw";

import {afterEach, describe, expect, it, vi} from "vitest";

import DrawInteraction from "./DrawInteraction";

function createMap() {
	const target = document.createElement("div");
	document.body.append(target);

	return new OlMap({
		target,
		view: new View({center: [0, 0], zoom: 1}),
	});
}

function startSketch(interaction: DrawInteraction, geometry: LineString) {
	const feature = new OlFeature(geometry);
	interaction.dispatchEvent(new DrawEvent("drawstart", feature));

	return feature;
}

describe("DrawInteraction measurement listeners", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("updates the measurement label once per geometry change after re-attaching", () => {
		const interaction = new DrawInteraction({type: "LineString"});
		const map = createMap();
		interaction.setMap(map);
		interaction.setMap(map);

		const geometry = new LineString([
			[0, 0],
			[1, 1],
		]);
		startSketch(interaction, geometry);

		const updateSpy = vi.spyOn(interaction, "updateMeasurementFeatures");
		geometry.setCoordinates([
			[0, 0],
			[2, 2],
		]);

		expect(updateSpy).toHaveBeenCalledTimes(1);
	});

	it("stops updating the measurement label after the sketch ended", () => {
		const interaction = new DrawInteraction({type: "LineString"});
		interaction.setMap(createMap());

		const geometry = new LineString([
			[0, 0],
			[1, 1],
		]);
		const feature = startSketch(interaction, geometry);
		interaction.dispatchEvent(new DrawEvent("drawend", feature));

		const updateSpy = vi.spyOn(interaction, "updateMeasurementFeatures");
		geometry.setCoordinates([
			[0, 0],
			[2, 2],
		]);

		expect(updateSpy).not.toHaveBeenCalled();
	});

	it("does not log on drawstart", () => {
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const interaction = new DrawInteraction({type: "LineString"});
		interaction.setMap(createMap());

		startSketch(
			interaction,
			new LineString([
				[0, 0],
				[1, 1],
			]),
		);

		expect(logSpy).not.toHaveBeenCalled();
	});
});
