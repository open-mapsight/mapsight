import Feature from "ol/Feature";
import type {Coordinate} from "ol/coordinate";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";

import * as nonNull from "@mapsight/lib-js/nonNullable";
import type {CreateClusterFeatureFunction} from "@mapsight/lib-ol/feature/cluster";
import getCentroid from "@mapsight/lib-ol/feature/getCentroid";
import spreadPointClusterInRadius from "@mapsight/lib-ol/points/spreadPointClusterInRadius";

export default function createCreateClusterIntoSpreadRadiusFeature(
	resolution: number,
	radius: number,
): CreateClusterFeatureFunction {
	return function clusterIntoSpreadRadiusFeature(
		clusterCenter: Coordinate,
		clusterFeatures: Array<Feature>,
	): Array<Feature> {
		const featureCentroids = clusterFeatures
			.map(getCentroid)
			.filter(nonNull.is);
		const spreadPoints = spreadPointClusterInRadius(
			clusterCenter,
			resolution,
			radius,
			featureCentroids,
		);
		const result: Array<Feature> = [];

		Object.entries(spreadPoints).forEach(
			function createSpreadFeaturesForPoint([pointKey, spreadPoint]) {
				const pointI = Number(pointKey);
				nonNull.assert(spreadPoint[0]);
				nonNull.assert(spreadPoint[1]);
				const feature = nonNull.ensure(clusterFeatures[pointI]);
				const basePoint = nonNull.ensure(featureCentroids[pointI]);
				nonNull.assert(basePoint[0]);
				nonNull.assert(basePoint[1]);
				const translateX = spreadPoint[0] - basePoint[0];
				const translateY = spreadPoint[1] - basePoint[1];

				const id = feature.getId();

				// Offset feature
				const spreadFeature = feature.clone();
				spreadFeature.set("spread", true, true);
				spreadFeature.getGeometry()?.translate(translateX, translateY);
				spreadFeature.setId(id);
				result.push(spreadFeature);

				// Line from spread (translated) feature to base position
				const lineFeature = new Feature({
					id: "cluster-spread-line||" + id,
					spreadFeatureLine: true,
					geometry: new LineString([basePoint, spreadPoint]),
					selectable: false,
				});
				result.push(lineFeature);

				// Dot at original position
				const dotFeature = new Feature({
					id: "cluster-spread-dot||" + id,
					spreadFeatureDot: true,
					geometry: new Point(basePoint),
					selectable: false,
				});
				result.push(dotFeature);
			},
		);

		return result;
	};
}
