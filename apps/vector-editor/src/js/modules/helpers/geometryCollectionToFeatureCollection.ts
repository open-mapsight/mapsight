import type {Feature, GeometryCollection} from "geojson";

function geometryCollectionToFeatureCollection(
	geometryCollection: GeometryCollection,
	properties = {},
	idPrefix = "feature-",
) {
	let idCounter = 0;

	return {
		type: "FeatureCollection",
		features: (geometryCollection.geometries || []).reduce(
			(features, geometry) => {
				const id = idPrefix + String(idCounter++);
				features.push({
					type: "Feature",
					id: id,
					properties: {
						id: id,
						...properties,
					},
					geometry: geometry,
				});
				return features;
			},
			[] as Feature[],
		),
	};
}

export default geometryCollectionToFeatureCollection;
