import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

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

export function assertRecord(
	value: unknown,
): asserts value is Record<string, unknown> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		throw new Error("Expected object");
	}
}

export function assertArray(value: unknown): asserts value is unknown[] {
	if (!Array.isArray(value)) {
		throw new Error("Expected array");
	}
}

export function assertString(value: unknown): asserts value is string {
	if (typeof value !== "string") {
		throw new Error("Expected string");
	}
}

export function assertNumber(value: unknown): asserts value is number {
	if (typeof value !== "number" || Number.isNaN(value)) {
		throw new Error("Expected number");
	}
}

export function parseTrafficEvent(value: unknown): TrafficEvent {
	assertRecord(value);
	assertNumber(value.id);
	assertString(value.title);
	assertString(value.start_date);
	assertString(value.end_date);

	if (typeof value.full_day !== "boolean") {
		throw new Error("Expected boolean for full_day");
	}

	const startTime = value.start_time;
	if (startTime !== null && typeof startTime !== "string") {
		throw new Error("Expected string or null for start_time");
	}

	const endTime = value.end_time;
	if (endTime !== null && typeof endTime !== "string") {
		throw new Error("Expected string or null for end_time");
	}

	return {
		id: value.id,
		title: value.title,
		start_date: value.start_date,
		end_date: value.end_date,
		full_day: value.full_day,
		start_time: startTime,
		end_time: endTime,
	};
}

export function parseTrafficEventsResponse(data: unknown): TrafficEventsData {
	assertRecord(data);

	const manualEvents = Array.isArray(data.manualEvents)
		? data.manualEvents.map(parseTrafficEvent)
		: [];

	return {manualEvents};
}
