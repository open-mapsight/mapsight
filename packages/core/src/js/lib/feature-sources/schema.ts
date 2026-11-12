import {z} from "zod";

import type {FeatureSourceData} from "@/lib/feature-sources/types";

export const featureSourceTypeSchema = z.enum([
	"local",
	"xhr-json",
	"noop",
	"combined",
]);

/**
 * Initial GeoJSON for a source that the host fills (`noop`). Validated loosely:
 * entries are checked when the data is indexed, not here.
 */
export const featureSourceInitialDataSchema = z.custom<FeatureSourceData>(
	(value) => {
		if (
			typeof value !== "object" ||
			value === null ||
			Array.isArray(value)
		) {
			return false;
		}
		const {type, features} = value as {type?: unknown; features?: unknown};
		return (
			(type === undefined || type === "FeatureCollection") &&
			(features === undefined || Array.isArray(features))
		);
	},
	{error: "Expected a GeoJSON FeatureCollection"},
);

export const featureSourceConfigSchema = z
	.object({
		type: featureSourceTypeSchema,
		url: z.string().optional(),
		data: featureSourceInitialDataSchema.nullable().optional(),
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
