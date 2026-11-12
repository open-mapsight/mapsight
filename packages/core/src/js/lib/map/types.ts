import type {Coordinate} from "ol/coordinate";
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

/**
 * View state of a map controller. The fields below are the ones the map
 * controller keeps in sync with the OpenLayers view; other keys are options
 * passed to the view on creation (for example `maxZoom` or `extent`).
 * Read it through the selectors in `@mapsight/core/lib/map/selectors`.
 *
 * `rotation` is only written for non-zero values, so treat a missing value as 0.
 */
export interface MapViewState {
	[key: string]: unknown;
	/** Center in view projection coordinates. */
	center?: Coordinate;
	/** Rounded zoom level; use `resolution` for the exact value. */
	zoom?: number;
	/** Map units per pixel in view projection. */
	resolution?: number;
	/** Rotation in radians, clockwise. */
	rotation?: number;
	minResolution?: number;
	maxResolution?: number;
}

export interface MapState {
	[key: string]: unknown;
	layers: Record<string, LayerState>;
	size: [number, number];
	view?: MapViewState;
	viewportAnchor?: ViewportAnchor;
	visibleLayers?: string[];
}

export type VectorFeatureSourceLayer = OlLayer<VectorFeatureSource>;

// NOTE: this is an empty interface on purpose it is meant to be extended
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LayerStyleProps {}

export type LayerStyleState = string | LayerStyleProps;
