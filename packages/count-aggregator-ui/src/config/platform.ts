import {z} from "zod";

import {ymdToDate} from "../lib/dates.js";
import type {DateRange, PresetData} from "../types";

const dateSchema = z.union([z.date(), z.string().transform(ymdToDate)]);

const stationRefSchema = z.object({
	id: z.number(),
	isEnabled: z.boolean(),
});

const dayDateRangeSchema = z.object({
	type: z.literal("day"),
	date: dateSchema,
});

const spanDateRangeSchema = z.object({
	type: z.literal("range"),
	startDate: dateSchema,
	endDate: dateSchema,
});

const dateRangeSchema = z.discriminatedUnion("type", [
	dayDateRangeSchema,
	spanDateRangeSchema,
]);

const presetPayloadSchema = z.object({
	mainStationId: z.number(),
	additionalStationRefs: z.array(stationRefSchema),
	additionalDateRanges: z.array(dateRangeSchema),
});

const presetResponseSchema = z.object({
	data: z.array(
		z.object({
			id: z.number(),
			name: z.string(),
			payload: z
				.string()
				.transform((payload, context) => {
					try {
						return JSON.parse(payload) as unknown;
					} catch {
						context.addIssue({
							code: "custom",
							message: "Expected preset payload to be valid JSON",
						});
						return z.NEVER;
					}
				})
				.pipe(presetPayloadSchema),
		}),
	),
});

export function deserializeRange(range: unknown): DateRange {
	const parsed = dateRangeSchema.parse(range);

	if (parsed.type === "day") {
		return parsed;
	}

	return parsed;
}

export function applyPresetDateRanges(
	additionalDateRanges: readonly DateRange[],
): {startDate: Date | null; endDate: Date | null} {
	let presetStartDate: Date | null = null;
	let presetEndDate: Date | null = null;

	for (const range of additionalDateRanges) {
		if (range.type === "day") {
			if (!presetStartDate || range.date < presetStartDate) {
				presetStartDate = range.date;
			}
			if (!presetEndDate || range.date > presetEndDate) {
				presetEndDate = range.date;
			}
		} else {
			if (!presetStartDate || range.startDate < presetStartDate) {
				presetStartDate = range.startDate;
			}
			if (!presetEndDate || range.endDate > presetEndDate) {
				presetEndDate = range.endDate;
			}
		}
	}

	return {startDate: presetStartDate, endDate: presetEndDate};
}

export function parsePresetsResponse(data: unknown): PresetData[] {
	const response = presetResponseSchema.parse(data);

	return response.data.map((raw) => {
		return {
			id: raw.id,
			value: raw.id,
			name: raw.name,
			mainStationId: raw.payload.mainStationId,
			additionalStationRefs: raw.payload.additionalStationRefs,
			additionalDateRanges: raw.payload.additionalDateRanges,
		};
	});
}
