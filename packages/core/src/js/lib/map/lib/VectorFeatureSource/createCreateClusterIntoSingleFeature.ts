import OlFeature from "ol/Feature";
import type {Coordinate} from "ol/coordinate";
import type {Geometry} from "ol/geom";
import Point from "ol/geom/Point";

import type {CreateClusterFeatureFunction} from "@mapsight/lib-ol/feature/cluster";

import type {
	ClusterOptions,
	FeatureClusterCache,
} from "@/lib/map/lib/VectorFeatureSource/FeatureClusterManager";

import defaultClusterFeaturePropertiesFunction from "./defaultClusterFeaturePropertiesFunction";

function createClusterFeatureId(
	coordinates: Coordinate,
	features: Array<OlFeature>,
) {
	return "cluster||" + features.map((feature) => feature.getId()).join("||");
}

/**
 * creates a createCluster* function that will create single point features for each cluster
 */
export default function createCreateClusterIntoSingleFeature(
	clusterFeaturePropertiesFunction = defaultClusterFeaturePropertiesFunction,
	options: ClusterOptions,
	cache?: FeatureClusterCache,
	previousCache?: FeatureClusterCache,
): CreateClusterFeatureFunction {
	return function clusterIntoSingleFeature(clusterCenter, clusterFeatures) {
		const id = createClusterFeatureId(clusterCenter, clusterFeatures);

		const baseProperties = {
			id: id,
			geometry: new Point(clusterCenter),
			cluster: true,
			clusterSize: clusterFeatures.length,
			clusterFeatures: clusterFeatures,
		};

		const featureProperties = clusterFeaturePropertiesFunction(
			baseProperties,
			options,
		);

		// reuse old feature and just update props or create new feature
		let clusterFeature;
		const cachedCluster = previousCache?.get(id);
		if (cachedCluster?.clusterFeature) {
			clusterFeature = cachedCluster.clusterFeature;
			clusterFeature.setProperties(featureProperties);
		} else {
			clusterFeature = new OlFeature<Geometry>(featureProperties);
			clusterFeature.setId(id);
		}

		if (cache) {
			cache.set(id, {
				clusterFeature: clusterFeature,
				features: clusterFeatures,
			});
		}

		return clusterFeature;
	};
}
