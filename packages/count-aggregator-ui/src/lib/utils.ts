import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";
import {z} from "zod";

import type {TrafficEvent, TrafficEventsData} from "../types/index.js";

export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

/** Document `lang`, or fallback when unset/invalid (e.g. host embed pages). */
export function getDocumentLocale(fallback = "de"): string {
	if (typeof document === "undefined") {
		return fallback;
	}

	const lang = document.documentElement.lang.trim();
	if (lang.length === 0) {
		return fallback;
	}

	try {
		new Intl.DateTimeFormat(lang);
		return lang;
	} catch {
		return fallback;
	}
}

export function isDefined<T>(value: T | null | undefined): value is T {
	return value !== null && value !== undefined;
}

const trafficEventSchema = z.object({
	id: z.number(),
	title: z.string(),
	start_date: z.string(),
	end_date: z.string(),
	full_day: z.boolean(),
	start_time: z.string().nullable(),
	end_time: z.string().nullable(),
});

const trafficEventsResponseSchema = z.preprocess(
	(value) => {
		if (
			typeof value !== "object" ||
			value === null ||
			Array.isArray(value)
		) {
			return value;
		}

		const record = value as Record<string, unknown>;
		return {
			...record,
			manualEvents: Array.isArray(record.manualEvents)
				? record.manualEvents
				: [],
		};
	},
	z.object({manualEvents: z.array(trafficEventSchema)}),
);

export function parseTrafficEvent(value: unknown): TrafficEvent {
	return trafficEventSchema.parse(value);
}

export function parseTrafficEventsResponse(data: unknown): TrafficEventsData {
	return trafficEventsResponseSchema.parse(data);
}
