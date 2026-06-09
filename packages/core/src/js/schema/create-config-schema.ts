import {z} from "zod";

/**
 * Compose a top-level config schema from per-slice schemas.
 * Slice keys match controller names registered at store creation time.
 */
export function createMapsightConfigSchema<
	TSliceSchemas extends Record<string, z.ZodType>,
>(sliceSchemas: TSliceSchemas) {
	return z.object(sliceSchemas).partial().catchall(z.unknown());
}
