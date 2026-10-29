import Feature from "ol/Feature";
import OlMap from "ol/Map";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

import {describe, expect, it, vi} from "vitest";

import {warmUpHitDetection} from "./warmUpHitDetection";

function setup(features: Feature[]) {
	const layer = new VectorLayer({source: new VectorSource({features})});
	const map = new OlMap({layers: [layer]});
	vi.spyOn(map, "getSize").mockReturnValue([400, 300]);
	const hitDetection = vi
		.spyOn(map, "forEachFeatureAtPixel")
		.mockReturnValue(undefined);
	const scheduled: Array<() => void> = [];
	return {
		map,
		layer,
		hitDetection,
		scheduled,
		schedule: (callback: () => void) => scheduled.push(callback),
	};
}

describe("warmUpHitDetection", () => {
	it("runs one hit detection in idle time after a vector layer with features rendered", () => {
		const {map, hitDetection, scheduled, schedule} = setup([
			new Feature(new Point([0, 0])),
		]);
		warmUpHitDetection(map, () => true, schedule);

		map.dispatchEvent("rendercomplete");
		map.dispatchEvent("rendercomplete");
		expect(scheduled).toHaveLength(1);
		expect(hitDetection).not.toHaveBeenCalled();

		scheduled[0]!();
		expect(hitDetection).toHaveBeenCalledTimes(1);
		expect(hitDetection.mock.calls[0]![0]).toEqual([200, 150]);
	});

	it("waits until a visible vector layer has features", () => {
		const {map, layer, scheduled, schedule} = setup([]);
		warmUpHitDetection(map, () => true, schedule);

		map.dispatchEvent("rendercomplete");
		expect(scheduled).toHaveLength(0);

		layer.getSource()!.addFeature(new Feature(new Point([0, 0])));
		layer.setVisible(false);
		map.dispatchEvent("rendercomplete");
		expect(scheduled).toHaveLength(0);

		layer.setVisible(true);
		map.dispatchEvent("rendercomplete");
		expect(scheduled).toHaveLength(1);
	});

	it("does nothing when no feature interaction needs hit detection", () => {
		const {map, scheduled, schedule} = setup([
			new Feature(new Point([0, 0])),
		]);
		warmUpHitDetection(map, () => false, schedule);

		map.dispatchEvent("rendercomplete");
		expect(scheduled).toHaveLength(0);
	});
});
