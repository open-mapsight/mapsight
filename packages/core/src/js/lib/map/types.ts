import type OlLayer from "ol/layer/Layer";

import type {VectorFeatureSource} from "@/lib/map/lib/VectorFeatureSource";
import type {ViewportAnchor} from "@/lib/map/lib/WithAnchoredViewport";

// TODO: find a better name? "TargetState"?
/** Describes the target state of an ol object (comparable to one entry in the vdom of react) */
export type Description = {
	type: string;
	options?: Options;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	metaData?: any; // TODO: type the metadata
};

export const isDescription = (value: unknown): value is Description =>
	typeof value === "object" &&
	value !== null &&
	"type" in value &&
	typeof value.type === "string";

export type Options = {[k: string]: OptionValue};

// Needs to be serializable
export type OptionValue =
	| string
	| boolean
	| number
	| Array<OptionValue>
	| Options
	| undefined
	| null;

export interface LayerMetaData {
	title?: string;
	group?: string;
	isBaseLayer?: boolean;
	attribution?: string;
	legend?: string;
	miniLegend?: string;
	lockedInLayerSwitcher?: boolean;
	visibleInLayerSwitcher?: boolean;
	visibleInExternalLayerSwitcher?: boolean;
}

export interface LayerState {
	[key: string]: unknown;
	metaData?: LayerMetaData;
	options?: {
		visible?: boolean;
		selections?: InteractionsSelections;
		source?: LayerSourceState;
	};
}

type VectorFeatureSourceState = {
	type: "VectorFeatureSource";
	options: {
		featureSourceId?: string;
		featureSourcesControllerName?: string;
		featureSelectionsControllerName?: string;
	};
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
