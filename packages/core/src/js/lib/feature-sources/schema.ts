import {z} from "zod";

export const featureSourceTypeSchema = z.enum(["local", "xhr-json", "noop"]);

export const featureSourceConfigSchema = z
	.object({
		type: featureSourceTypeSchema,
		url: z.string().optional(),
		filters: z.array(z.string()).optional(),
		doRefresh: z.boolean().optional(),
		timer: z.number().optional(),
		enableHistory: z.boolean().optional(),
	})
	.strict();

export const featureSourcesConfigSchema = z.record(
	z.string(),
	featureSourceConfigSchema,
);

export type FeatureSourceConfig = z.infer<typeof featureSourceConfigSchema>;
export type FeatureSourcesConfig = z.infer<typeof featureSourcesConfigSchema>;
