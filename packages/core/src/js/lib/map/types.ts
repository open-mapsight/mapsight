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
 * What the view selectors in `@mapsight/core/lib/map/selectors` return for the
 * view state of a map controller. Read it through those selectors; the state
 * itself may hold further keys (options for the OpenLayers view such as
 * `maxZoom` or `extent`) that are not part of this type.
 *
 * `MapState` does not type its `view` with this interface, so plain host
 * objects and interfaces stay assignable to it.
 */
export interface MapViewState {
	/**
	 * Center as the OpenLayers view reports it: in view projection coordinates
	 * (EPSG:3857), or in the user projection (for example degrees after
	 * `useGeographic()` from `ol/proj`) when one is set.
	 */
	center?: Coordinate;
	/** Rounded zoom level; use `resolution` for the exact value. */
	zoom?: number;
	/** Map units per pixel in view projection (not in user projection units). */
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
	viewportAnchor?: ViewportAnchor;
	visibleLayers?: string[];
}

export type VectorFeatureSourceLayer = OlLayer<VectorFeatureSource>;

// NOTE: this is an empty interface on purpose it is meant to be extended
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LayerStyleProps {}

export type LayerStyleState = string | LayerStyleProps;
