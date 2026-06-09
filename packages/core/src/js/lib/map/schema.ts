import {z} from "zod";

import {optionsSchema} from "@/lib/helpers/schema";

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

export const descriptionSchema = z.looseObject({
	type: z.string(),
	options: optionsSchema.optional(),
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

export type LayerMetaData = z.infer<typeof layerMetaDataSchema>;
export type Description = z.infer<typeof descriptionSchema>;
export type LayerConfig = z.infer<typeof layerConfigSchema>;
export type MapConfig = z.infer<typeof mapConfigSchema>;
