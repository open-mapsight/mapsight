import {z} from "zod";

export const listConfigSchema = z.looseObject({
	featureSource: z.string().optional(),
	visible: z.boolean().optional(),
	featureSelectionHighlight: z.string().optional(),
	featureSelectionSelect: z.string().optional(),
});

export type ListConfig = z.infer<typeof listConfigSchema>;
