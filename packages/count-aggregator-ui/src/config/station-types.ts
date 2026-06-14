import type {StationTypeSummary} from "@mapsight/count-aggregator-api";

import type {
	CountAggregatorAppConfig,
	CountAggregatorConfig,
	StationType,
} from "../types";

export const DEFAULT_PUBLIC_API_BASE_URL = "/msp/public/count-aggregator";

export interface StationTypeAppsConfigOptions {
	apiBaseUrl?: string;
	links?: CountAggregatorConfig["links"];
	locale?: CountAggregatorConfig["locale"];
	translations?: CountAggregatorConfig["translations"];
}

function createAppConfigForStationType(
	stationType: StationType,
	apiBaseUrl: string,
): CountAggregatorAppConfig {
	const isBicycleCount = stationType === "bicycleCount";

	return {
		id: stationType,
		apiBaseUrl,
		stationType,
		uiVariant: isBicycleCount ? "stepped" : "single-page",
		defaultResolution: "daily",
		defaultChartType: isBicycleCount ? "area" : "line",
		resolutions: ["hourly", "daily", "weekly", "monthly", "yearly"],
		features: {
			resolutionSelect: true,
			chartTypeSelect: isBicycleCount,
			export: true,
			presets: false,
			events: false,
		},
	};
}

export function createStationTypeAppsConfig(
	stationTypes: readonly StationTypeSummary[],
	options: StationTypeAppsConfigOptions = {},
): CountAggregatorConfig {
	const apiBaseUrl = options.apiBaseUrl ?? DEFAULT_PUBLIC_API_BASE_URL;
	const apps: Record<string, CountAggregatorAppConfig> = {};

	for (const entry of stationTypes) {
		apps[entry.type] = createAppConfigForStationType(
			entry.type,
			apiBaseUrl,
		);
	}

	return {
		apps,
		links: options.links ?? {
			calendarUrl: (dateYmd) =>
				`/msp/traffic-calendar/calendar/${dateYmd}`,
			eventUrl: (endDateYmd, eventId) =>
				`/msp/traffic-calendar/calendar/${endDateYmd}/event/${eventId}`,
		},
		locale: options.locale,
		translations: options.translations,
	};
}
