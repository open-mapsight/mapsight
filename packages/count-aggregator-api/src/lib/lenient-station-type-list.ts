import {z} from "zod";

function stationTypeLabel(entry: unknown): string | undefined {
	if (
		typeof entry === "object" &&
		entry !== null &&
		"type" in entry &&
		typeof entry.type === "string"
	) {
		return entry.type;
	}

	return undefined;
}

/**
 * Parse `GET /station-types` without failing the whole list when the platform
 * adds types that are not yet in the OpenAPI enum. Unknown entries are dropped
 * and logged so the UI can still load known types.
 */
export function createLenientStationTypeListResponseSchema<T>(
	stationTypeSummary: z.ZodType<T>,
): z.ZodType<{data: T[]}> {
	return z.looseObject({
		data: z.array(z.unknown()).transform((entries) => {
			const accepted: T[] = [];

			for (const entry of entries) {
				const parsed = stationTypeSummary.safeParse(entry);
				if (parsed.success) {
					accepted.push(parsed.data);
					continue;
				}

				const type = stationTypeLabel(entry);
				console.warn(
					type === undefined
						? "[@mapsight/count-aggregator-api] Ignoring station type entry that failed validation"
						: `[@mapsight/count-aggregator-api] Ignoring unknown or invalid station type "${type}"`,
					z.flattenError(parsed.error),
				);
			}

			return accepted;
		}),
	});
}
