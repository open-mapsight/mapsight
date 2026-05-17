import type Feature from "ol/Feature";

import * as nonNull from "@mapsight/lib-js/nonNullable";

import middleCoordinate from "../coordinates/middleCoordinate";
import getCentroid from "../feature/getCentroid";

export default function getCentroidForFeatures(features: Array<Feature>) {
	return middleCoordinate(features.map(getCentroid).filter(nonNull.is));
}
