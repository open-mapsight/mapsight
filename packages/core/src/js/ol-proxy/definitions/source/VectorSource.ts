import Collection from "ol/Collection";
import type Feature from "ol/Feature";
import {type FeatureLike} from "ol/Feature";
import type Geometry from "ol/geom/Geometry";
import OlVectorSource from "ol/source/Vector";

import type {Definition} from "@/ol-proxy";
import {
	OPTION_COLLECTION,
	OPTION_SET,
	createDependencyMapper,
	di,
} from "@/ol-proxy";

import base from "./_base";

class VectorSource<
	FeatureType extends FeatureLike = Feature<
		Geometry,
		Record<string, unknown>
	>,
> extends OlVectorSource<FeatureType> {
	constructor(options: ConstructorParameters<typeof OlVectorSource>[0]) {
		const features = new Collection<FeatureType>();

		super({
			// NOTE: We pass an empty Collection to make sure
			// we have getFeaturesCollection() available to
			// be able to replace features dynamically:
			// @ts-expect-error TODO FIXME
			features,
			...options,
		});
	}
}

type Ctor = typeof VectorSource;

export default {
	type: "VectorSource",
	Constructor: VectorSource,
	optionMap: {
		...base.optionMap,
		logo: OPTION_SET,
		overlaps: OPTION_SET,
		strategy: OPTION_SET,
		useSpatialIndex: OPTION_SET,
		wrapX: OPTION_SET,
		features: [OPTION_COLLECTION, "getFeaturesCollection"],
	},
	initialOptionMap: {
		...base.initialOptionMap,
		logo: "logo",
		overlaps: "overlaps",
		strategy: "strategy",
		useSpatialIndex: "useSpatialIndex",
		wrapX: "wrapX",
		url: "url",
		loader: "loader",
		format: createDependencyMapper(di, "format"), // TODO: features
	},
} satisfies Definition<Ctor>;
