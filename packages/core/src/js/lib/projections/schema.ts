import {z} from "zod";

export const projectionsConfigSchema = z.array(z.string());

export type ProjectionsConfig = z.infer<typeof projectionsConfigSchema>;
