import VectorFeatureSource from "@/lib/map/lib/VectorFeatureSource/VectorFeatureSource";
import type {Definition} from "@/ol-proxy";
import {OPTION_SET} from "@/ol-proxy";

type Ctor = typeof VectorFeatureSource;

export default {
	type: "VectorFeatureSource",
	Constructor: VectorFeatureSource,
	optionMap: {
		overlaps: OPTION_SET,
		useSpatialIndex: OPTION_SET,
		wrapX: OPTION_SET,
		extent: OPTION_SET,
		active: "setActive",
		attributions: "setAttributions",
		featureSourcesControllerName: "setFeatureSourcesControllerName",
		featureSourceId: "setFeatureSourceId",
		featureSelectionsControllerName: "setFeatureSelectionsControllerName",
		projection: "setProjection",
		featureSelections: "setFeatureSelections",
		keepFeaturesInViewSelections: "setKeepFeaturesInViewSelections",
		keepFeaturesInViewOptions: "setKeepFeaturesInViewOptions",
		keepAllFeaturesInView: "setKeepAllFeaturesInView",
		fitFeaturesInViewSelections: "setFitFeaturesInViewSelections",
		fitFeaturesInViewOptions: "setFitFeaturesInViewOptions",
		fitAllFeaturesInView: "setFitAllFeaturesInView",
		centerFeaturesInViewSelections: "setCenterFeaturesInViewSelections",
		centerFeaturesInViewOptions: "setCenterFeaturesInViewOptions",
		centerAllFeaturesInView: "setCenterAllFeaturesInView",
		clusterFeatures: "setClusterFeatures",
		clusterFeaturesOptions: "setClusterFeaturesOptions",
	},
	initialOptionMap: {
		canAnimate: true,
		canCluster: true,
		useSelectionOverlay: true,
	},
} satisfies Definition<Ctor>;
