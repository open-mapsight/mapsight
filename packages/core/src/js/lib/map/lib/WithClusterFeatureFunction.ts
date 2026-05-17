import {BaseController} from "@/lib/base/controller";
import type {FeatureClusterPropertiesFunction} from "@/lib/map/lib/VectorFeatureSource/FeatureClusterManager";
import type {MapState} from "@/lib/map/types";

export default class WithClusterFeatureFunction extends BaseController<MapState> {
	_clusterFeaturePropertiesFunction:
		| FeatureClusterPropertiesFunction
		| undefined;

	setClusterFeaturePropertiesFunction(
		clusterFeaturePropertiesFunction: FeatureClusterPropertiesFunction,
	) {
		this._clusterFeaturePropertiesFunction =
			clusterFeaturePropertiesFunction;
	}

	getClusterFeaturePropertiesFunction() {
		return this._clusterFeaturePropertiesFunction;
	}
}
