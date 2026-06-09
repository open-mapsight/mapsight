import {z} from "zod";

import {type Options, optionsSchema} from "@/lib/helpers/schema";
import {FeatureInteractionNames} from "@/lib/map/lib/WithFeatureInteractions";

export const interactionsSelectionsSchema = z.partialRecord(
	z.enum(FeatureInteractionNames),
	z.string(),
);

export const layerMetaDataSchema = z.looseObject({
	title: z.string().optional(),
	group: z.string().optional(),
	isBaseLayer: z.boolean().optional(),
	attribution: z.string().optional(),
	legend: z.string().optional(),
	miniLegend: z.string().optional(),
	lockedInLayerSwitcher: z.boolean().optional(),
	visibleInLayerSwitcher: z.boolean().optional(),
	visibleInExternalLayerSwitcher: z.boolean().optional(),
});

export const vectorFeatureSourceOptionsSchema = z.looseObject({
	featureSourceId: z.string().optional(),
	featureSourcesControllerName: z.string().optional(),
	featureSelectionsControllerName: z.string().optional(),
	keepFeaturesInViewOptions: optionsSchema.optional(),
	fitFeaturesInViewOptions: optionsSchema.optional(),
	clusterFeatures: z.boolean().optional(),
	clusterFeaturesOptions: optionsSchema.optional(),
});

export const vectorFeatureSourceStateSchema = z.looseObject({
	type: z.literal("VectorFeatureSource"),
	options: vectorFeatureSourceOptionsSchema,
});

export const osmSourceStateSchema = z.looseObject({
	type: z.literal("OsmSource"),
	options: z.looseObject({url: z.string().optional()}),
});

export const tileWmsSourceStateSchema = z.looseObject({
	type: z.literal("TileWMSSource"),
	options: z.looseObject({
		projection: z.string().optional(),
		url: z.string().optional(),
		params: optionsSchema.optional(),
	}),
});

/** Known ol-proxy source shapes plus a fallback for other source types. */
export const layerSourceStateSchema = z.union([
	vectorFeatureSourceStateSchema,
	osmSourceStateSchema,
	tileWmsSourceStateSchema,
	z.looseObject({
		type: z.string(),
		options: optionsSchema.optional(),
	}),
]);

export const layerOptionsSchema = z.looseObject({
	visible: z.boolean().optional(),
	selections: interactionsSelectionsSchema.optional(),
	source: layerSourceStateSchema.optional(),
});

export const descriptionSchema = z.looseObject({
	type: z.string(),
	options: layerOptionsSchema.optional(),
	metaData: layerMetaDataSchema.optional(),
});

export const layerConfigSchema = descriptionSchema;

export const mapConfigSchema = z
	.looseObject({
		layers: z.record(z.string(), layerConfigSchema).optional(),
		size: z.tuple([z.number(), z.number()]).optional(),
		view: optionsSchema.optional(),
		controls: optionsSchema.optional(),
		interactions: optionsSchema.optional(),
		visibleLayers: z.array(z.string()).optional(),
		viewportAnchor: optionsSchema.optional(),
	})
	.partial();

/** Loose-object schema output plus ol-proxy option bag. */
type LooseOptions<T extends z.ZodType> = z.infer<T> & Options;

export type LayerMetaData = z.infer<typeof layerMetaDataSchema>;
export type InteractionsSelections = z.infer<
	typeof interactionsSelectionsSchema
>;
export type VectorFeatureSourceOptions = LooseOptions<
	typeof vectorFeatureSourceOptionsSchema
>;
export type VectorFeatureSourceState = z.infer<
	typeof vectorFeatureSourceStateSchema
> & {
	options: VectorFeatureSourceOptions;
};
export type LayerSourceState = z.infer<typeof layerSourceStateSchema>;
export type LayerOptions = LooseOptions<typeof layerOptionsSchema>;

type WithLayerOptions<T extends {options?: unknown}> = Omit<T, "options"> & {
	options?: LayerOptions;
};

export type Description = WithLayerOptions<
	Omit<z.infer<typeof descriptionSchema>, "type" | "metaData">
> & {
	type: string;
	metaData?: LayerMetaData;
};
export type LayerConfig = Description;
export type MapConfig = Omit<z.infer<typeof mapConfigSchema>, "layers"> & {
	layers?: Record<string, LayerConfig>;
};
