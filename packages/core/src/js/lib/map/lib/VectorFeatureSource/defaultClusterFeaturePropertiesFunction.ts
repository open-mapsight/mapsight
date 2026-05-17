import type {FeatureClusterPropertiesFunction} from "@/lib/map/lib/VectorFeatureSource/FeatureClusterManager";

const defaultClusterFeaturePropertiesFunction: FeatureClusterPropertiesFunction =
	(properties, options) => {
		if (options.properties) {
			Object.assign(properties, options.properties);
		}

		return properties;
	};

export default defaultClusterFeaturePropertiesFunction;
