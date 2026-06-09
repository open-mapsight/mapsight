import {z} from "zod";

export const featureSelectionsConfigSchema = z.record(z.string(), z.unknown());

export type FeatureSelectionsConfig = z.infer<
	typeof featureSelectionsConfigSchema
>;
