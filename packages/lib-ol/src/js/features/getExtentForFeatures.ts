import type Feature from "ol/Feature";

import * as nonNull from "@mapsight/lib-js/nonNullable";

import combineExtents from "../extents/combineExtents";
import getExtent from "../feature/getExtent";

export default function getExtentForFeatures(features: Array<Feature>) {
	return combineExtents(features.map(getExtent).filter(nonNull.is));
}
