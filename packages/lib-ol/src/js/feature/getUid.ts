import type Feature from "ol/Feature";
import {getUid as olGetUid} from "ol/util";

export default function getUid(feature: Feature) {
	return olGetUid(feature).toString();
}
