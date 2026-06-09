import type OlLayer from "ol/layer/Layer";

import type {OptionValue, Options} from "@/lib/helpers/schema";
import type {VectorFeatureSource} from "@/lib/map/lib/VectorFeatureSource";
import type {ViewportAnchor} from "@/lib/map/lib/WithAnchoredViewport";
import {
	type Description,
	type InteractionsSelections,
	type LayerConfig,
	type LayerMetaData,
	type LayerOptions,
	type LayerSourceState,
	type VectorFeatureSourceOptions,
	type VectorFeatureSourceState,
	descriptionSchema,
	vectorFeatureSourceStateSchema,
} from "@/lib/map/schema";

export type {
	Description,
	InteractionsSelections,
	LayerMetaData,
	LayerOptions,
	LayerSourceState,
	OptionValue,
	Options,
	VectorFeatureSourceOptions,
	VectorFeatureSourceState,
};

export const isDescription = (value: unknown): value is Description =>
	descriptionSchema.safeParse(value).success;

/** Runtime layer options; ol-proxy keys beyond the config schema remain valid. */
export type RuntimeLayerOptions = LayerOptions;

/** Runtime layer state; `type` is required in config ingress (`LayerConfig`). */
export type LayerState = Omit<LayerConfig, "type" | "options" | "metaData"> & {
	type?: string;
	metaData?: LayerMetaData;
	options?: RuntimeLayerOptions;
} & Record<string, unknown>;

export const isVectorFeatureSource = (
	source: unknown,
): source is VectorFeatureSourceState =>
	vectorFeatureSourceStateSchema.safeParse(source).success;

export function getVectorFeatureSource(
	layer: LayerState,
): VectorFeatureSourceState {
	const source = layer.options?.source;
	if (!isVectorFeatureSource(source)) {
		throw new Error("Expected layer with VectorFeatureSource source");
	}
	return source;
}

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
