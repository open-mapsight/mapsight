import {z} from "zod";

export const featureSourceTypeSchema = z.enum([
	"local",
	"xhr-json",
	"noop",
	"combined",
]);

export const featureSourceConfigSchema = z
	.object({
		type: featureSourceTypeSchema,
		url: z.string().optional(),
		featureSourceNames: z.array(z.string()).optional(),
		filters: z.array(z.string()).optional(),
		doRefresh: z.boolean().optional(),
		timer: z.number().optional(),
		enableHistory: z.boolean().optional(),
		historyLimit: z.number().int().positive().optional(),
		/**
		 * Optional host-facing label (pre-OSS embeds; not used by core itself).
		 *
		 * @deprecated Prefer host-owned labels outside feature-source config.
		 *   May be removed in the next major of `@mapsight/core`.
		 */
		name: z.string().optional(),
	})
	.strict();

export const featureSourcesConfigSchema = z.record(
	z.string(),
	featureSourceConfigSchema,
);

export type FeatureSourceConfig = z.infer<typeof featureSourceConfigSchema>;
export type FeatureSourcesConfig = z.infer<typeof featureSourcesConfigSchema>;
