import {ymdToDate} from "../lib/dates.js";
import {
	assertArray,
	assertNumber,
	assertRecord,
	assertString,
} from "../lib/utils.js";
import type {
	CountAggregatorAppConfig,
	CountAggregatorConfig,
	DateRange,
	PresetData,
	StationRef,
} from "../types";

export function createPlatformConfig(): CountAggregatorConfig {
	return {
		apps: {
			"traffic-data": {
				id: "traffic-data",
				apiBaseUrl: "/msp/public/count-aggregator",
				stationType: "bicycleCount",
				uiVariant: "single-page",
				defaultResolution: "daily",
				defaultChartType: "line",
				features: {
					presets: true,
					events: true,
				},
				showEvents: true,
				endpoints: {
					events: "/msp/count-aggregator/traffic-data/events",
					presets: "/msp/count-aggregator/presets",
				},
			},
			"smart-city": {
				id: "smart-city",
				apiBaseUrl: "/msp/public/count-aggregator",
				stationType: "peopleCount",
				uiVariant: "single-page",
				defaultResolution: "daily",
				defaultChartType: "line",
				features: {
					presets: true,
				},
				endpoints: {
					presets: "/msp/count-aggregator/presets",
				},
			},
			"wheel-counter": {
				id: "wheel-counter",
				apiBaseUrl: "/msp/public/count-aggregator",
				stationType: "bicycleCount",
				uiVariant: "stepped",
				defaultResolution: "daily",
				defaultChartType: "area",
				resolutions: ["hourly", "daily", "weekly", "monthly", "yearly"],
				features: {
					resolutionSelect: true,
					chartTypeSelect: true,
					export: true,
					presets: false,
					events: false,
				},
			},
		},
		links: {
			calendarUrl: (dateYmd) =>
				`/msp/traffic-calendar/calendar/${dateYmd}`,
			eventUrl: (endDateYmd, eventId) =>
				`/msp/traffic-calendar/calendar/${endDateYmd}/event/${eventId}`,
		},
	};
}

export function getAppConfig(
	config: CountAggregatorConfig,
	appId: string,
): CountAggregatorAppConfig {
	return config.apps[appId]!;
}

function deserializeDate(value: unknown): Date {
	if (value instanceof Date) {
		return value;
	}

	assertString(value);
	return ymdToDate(value);
}

function parseStationRef(value: unknown): StationRef {
	assertRecord(value);
	assertNumber(value.id);

	if (typeof value.isEnabled !== "boolean") {
		throw new Error("Expected boolean for isEnabled");
	}

	return {id: value.id, isEnabled: value.isEnabled};
}

export function deserializeRange(range: unknown): DateRange {
	assertRecord(range);

	if (range.type === "day") {
		return {
			type: "day",
			date: deserializeDate(range.date),
		};
	}

	if (range.type === "range") {
		return {
			type: "range",
			startDate: deserializeDate(range.startDate),
			endDate: deserializeDate(range.endDate),
		};
	}

	throw new Error(`Unsupported date range type "${String(range.type)}"`);
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
	assertRecord(data);
	assertArray(data.data);

	return data.data.map((raw: unknown) => {
		assertRecord(raw);
		assertNumber(raw.id);
		assertString(raw.name);
		assertString(raw.payload);

		const payload = JSON.parse(raw.payload) as Record<string, unknown>;
		assertNumber(payload.mainStationId);
		assertArray(payload.additionalStationRefs);
		assertArray(payload.additionalDateRanges);

		return {
			id: raw.id,
			value: raw.id,
			name: raw.name,
			mainStationId: payload.mainStationId,
			additionalStationRefs:
				payload.additionalStationRefs.map(parseStationRef),
			additionalDateRanges:
				payload.additionalDateRanges.map(deserializeRange),
		};
	});
}
