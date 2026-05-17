import type {FeatureCollection, Geometry, GeometryCollection} from "geojson";

function featureCollectionToGeometryCollection(
	featureCollection: FeatureCollection,
): GeometryCollection {
	return {
		type: "GeometryCollection",
		geometries: (featureCollection.features || []).reduce(
			(geometries, feature) => {
				if (feature.geometry) {
					geometries.push(feature.geometry);
				}
				return geometries;
			},
			[] as Geometry[],
		),
	};
}

export default featureCollectionToGeometryCollection;
