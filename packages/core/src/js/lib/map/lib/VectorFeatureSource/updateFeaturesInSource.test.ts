import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorSource from "ol/source/Vector";

import {describe, expect, it, vi} from "vitest";

import {updateFeaturesInSource} from "./updateFeaturesInSource";

type PlaceTagGroups = {place: string[]};

function createPlaceFeature() {
	const feature = new Feature({
		geometry: new Point([10.5, 52.2]),
		name: "Parkhaus Eiermarkt",
		markerCaption: "207",
		description: "<section>fat html</section>",
		tagGroups: {place: ["innenstadt"]} satisfies PlaceTagGroups,
	});
	feature.setId("place-1");
	return feature;
}

/**
 * Rebuild the way `GeoJSON.readFeatures` does on a poll: new Feature, new
 * Geometry, new nested property objects. Primitive values stay equal.
 */
function rereadFeature(source: Feature): Feature {
	const next = source.clone();
	const id = source.getId();
	if (id !== undefined) {
		next.setId(id);
	}

	const tagGroups = source.get("tagGroups") as PlaceTagGroups | undefined;
	if (tagGroups) {
		next.set(
			"tagGroups",
			{place: tagGroups.place ? [...tagGroups.place] : []},
			true,
		);
	}

	return next;
}

function sourceWithFeature(feature: Feature) {
	const source = new VectorSource({features: [feature]});
	const sourceChanged = vi.spyOn(source, "changed");
	const changeFeature = vi.fn();
	source.on("changefeature", changeFeature);
	return {source, sourceChanged, changeFeature};
}

describe("updateFeaturesInSource", () => {
	it("does not rewrite or notify when a poll rereads identical features", () => {
		const feature = createPlaceFeature();
		const geometry = feature.getGeometry();
		const {source, sourceChanged, changeFeature} =
			sourceWithFeature(feature);

		const result = updateFeaturesInSource(source, [rereadFeature(feature)]);

		expect(result).toEqual({changed: false, added: false, removed: false});
		expect(changeFeature).not.toHaveBeenCalled();
		expect(sourceChanged).not.toHaveBeenCalled();
		expect(source.getFeatureById("place-1")).toBe(feature);
		expect(feature.getGeometry()).toBe(geometry);
	});

	it("applies a real geometry change without silencing the event", () => {
		const feature = createPlaceFeature();
		const {source, sourceChanged, changeFeature} =
			sourceWithFeature(feature);
		const geometryChanged = vi.fn();
		feature.on("change:geometry", geometryChanged);

		const next = rereadFeature(feature);
		next.setGeometry(new Point([11, 53]));

		const result = updateFeaturesInSource(source, [next]);

		expect(result.changed).toBe(true);
		expect(feature.getGeometry()?.getFlatCoordinates()).toEqual([11, 53]);
		expect(geometryChanged).toHaveBeenCalled();
		expect(changeFeature).toHaveBeenCalled();
		expect(sourceChanged).toHaveBeenCalled();
	});

	it("applies a core key change and notifies", () => {
		const feature = createPlaceFeature();
		const geometry = feature.getGeometry();
		const {source, sourceChanged, changeFeature} =
			sourceWithFeature(feature);

		const next = rereadFeature(feature);
		next.set("markerCaption", "208", true);

		const result = updateFeaturesInSource(source, [next]);

		expect(result.changed).toBe(true);
		expect(feature.get("markerCaption")).toBe("208");
		expect(feature.getGeometry()).toBe(geometry);
		expect(changeFeature).toHaveBeenCalled();
		expect(sourceChanged).toHaveBeenCalled();
	});

	it("leaves tagGroups on the existing feature when only that object is new", () => {
		const feature = createPlaceFeature();
		const tagGroups = feature.get("tagGroups") as PlaceTagGroups;
		const {source, sourceChanged, changeFeature} =
			sourceWithFeature(feature);

		const next = rereadFeature(feature);
		next.set("tagGroups", {place: ["other"]}, true);

		const result = updateFeaturesInSource(source, [next]);

		expect(result).toEqual({changed: false, added: false, removed: false});
		expect(changeFeature).not.toHaveBeenCalled();
		expect(sourceChanged).not.toHaveBeenCalled();
		expect(feature.get("tagGroups")).toBe(tagGroups);
		expect(feature.get("markerCaption")).toBe("207");
		expect(feature.get("name")).toBe("Parkhaus Eiermarkt");
	});
});
