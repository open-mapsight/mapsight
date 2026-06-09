import type OlLayer from "ol/layer/Layer";

import type {OptionValue, Options} from "@/lib/helpers/schema";
import type {VectorFeatureSource} from "@/lib/map/lib/VectorFeatureSource";
import type {ViewportAnchor} from "@/lib/map/lib/WithAnchoredViewport";
import type {Description, LayerConfig, LayerMetaData} from "@/lib/map/schema";

export type {Description, LayerMetaData, OptionValue, Options};

export const isDescription = (value: unknown): value is Description =>
	typeof value === "object" &&
	value !== null &&
	"type" in value &&
	typeof value.type === "string";

export type LayerOptions = {
	visible?: boolean;
	selections?: InteractionsSelections;
	source?: LayerSourceState;
} & Options;

/** Runtime layer state; `type` is required in config ingress (`LayerConfig`). */
export type LayerState = Omit<LayerConfig, "type"> & {
	type?: string;
	[key: string]: unknown;
	metaData?: LayerMetaData;
	options?: LayerOptions;
};

type VectorFeatureSourceOptions = {
	featureSourceId?: string;
	featureSourcesControllerName?: string;
	featureSelectionsControllerName?: string;
	keepFeaturesInViewOptions?: Options;
	fitFeaturesInViewOptions?: Options;
	clusterFeatures?: boolean;
	clusterFeaturesOptions?: Options;
	[key: string]: OptionValue;
};

type VectorFeatureSourceState = {
	type: "VectorFeatureSource";
	options: VectorFeatureSourceOptions;
};

export type LayerSourceState = VectorFeatureSourceState; // TODO: add other types

export interface MapState {
	[key: string]: unknown;
	layers: Record<string, LayerState>;
	size: [number, number];
	viewportAnchor?: ViewportAnchor;
	visibleLayers?: string[];
}

export type VectorFeatureSourceLayer = OlLayer<VectorFeatureSource>;

// NOTE: this is an empty interface on purpose it is meant to be extended
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LayerStyleProps {}

export type LayerStyleState = string | LayerStyleProps;

export type InteractionName = "mousedown" | "mouseover" | "touch";

export type InteractionsSelections = Record<InteractionName, string>;
