import type {Type as GeometryType} from "ol/geom/Geometry";
import type Geometry from "ol/geom/Geometry";
import GeometryCollection from "ol/geom/GeometryCollection";

import {isNonNullable} from "@mapsight/lib-js/nonNullable";

const GEOMETRY_TYPE_DOMINANCE: Record<GeometryType, number> = {
	GeometryCollection: 0,
	Circle: 1,
	Point: 1,
	LineString: 2,
	LinearRing: 2,
	MultiPoint: 2,
	Polygon: 3,
	MultiLineString: 3,
	MultiPolygon: 4,
};

function getGeometryTypeDominance(geometryType: GeometryType) {
	return GEOMETRY_TYPE_DOMINANCE[geometryType] ?? 0;
}

export default function getDominantGeometryType(
	geometry: Geometry,
): undefined | GeometryType {
	if (geometry instanceof GeometryCollection) {
		const types = geometry
			.getGeometries()
			.map(getDominantGeometryType)
			.filter(isNonNullable);
		types.sort(
			(a, b) =>
				// TODO: use compare helper
				getGeometryTypeDominance(b) - getGeometryTypeDominance(a),
		);
		return types[0];
	}

	return geometry.getType();
}
