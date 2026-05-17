import Feature from "ol/Feature";
import type {Coordinate} from "ol/coordinate";
import type {Extent} from "ol/extent";
import {buffer, createEmpty, createOrUpdateFromCoordinate} from "ol/extent";
import Point from "ol/geom/Point";

import {isNonNullable} from "@mapsight/lib-js/nonNullable";

import getCentroidForFeatures from "../features/getCentroidForFeatures";
import type {Resolution} from "../index";
import getCentroid from "./getCentroid";
import getUid from "./getUid";

export type CreateClusterFeatureFunction = (
	centroid: Coordinate,
	features: Array<Feature>,
) => Array<Feature> | Feature;

const defaultCreateClusterFeature: CreateClusterFeatureFunction = (
	centroid: Coordinate,
	features: Array<Feature>,
) => {
	const clusterFeature = new Feature(new Point(centroid));
	clusterFeature.set("features", features);
	return clusterFeature;
};

const defaultDistance = 20;

export default function cluster(
	features: Array<Feature>,
	resolution: Resolution,
	getFeaturesInExtent: (extent: Extent) => Array<Feature>,
	distance = defaultDistance,
	createClusterFeature: CreateClusterFeatureFunction = defaultCreateClusterFeature,
	mapFeatureToCoordinate = getCentroid,
): Array<Feature> {
	if (resolution === undefined) {
		return features;
	}

	const mapDistance = distance * resolution;
	const extent = createEmpty();
	const isClusteredMap: Record<string, boolean> = {};
	const markClustered = (feature: Feature) => {
		isClusteredMap[getUid(feature)] = true;
	};
	const isAlreadyClustered = (feature: Feature) =>
		getUid(feature) in isClusteredMap;
	const isNotAlreadyClustered = (feature: Feature) =>
		!isAlreadyClustered(feature);

	return features
		.flatMap((feature) => {
			if (isAlreadyClustered(feature)) {
				return undefined;
			}

			const coordinate = mapFeatureToCoordinate(feature);
			const canCluster =
				coordinate &&
				coordinate.length >= 2 &&
				coordinate[0] &&
				coordinate[1];

			if (canCluster) {
				// reuse extent to reduce object creation
				createOrUpdateFromCoordinate(coordinate, extent);
				buffer(extent, mapDistance, extent);

				const neighbors = getFeaturesInExtent(extent).filter(
					isNotAlreadyClustered,
				);
				if (neighbors.length >= 2) {
					neighbors.forEach(markClustered);
					return createClusterFeature(
						getCentroidForFeatures(neighbors),
						neighbors,
					);
				}
			}

			return feature;
		})
		.filter(isNonNullable);
}
