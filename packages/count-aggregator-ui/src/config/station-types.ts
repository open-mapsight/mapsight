import type {StationTypeSummary} from "@mapsight/count-aggregator-api";

import type {
	BucketMetric,
	CountAggregatorAppConfig,
	CountAggregatorConfig,
	Resolution,
	StationType,
} from "../types";

export const DEFAULT_PUBLIC_API_BASE_URL = "/msp/public/count-aggregator";

export interface StationTypeAppsConfigOptions {
	apiBaseUrl?: string;
	links?: CountAggregatorConfig["links"];
	locale?: CountAggregatorConfig["locale"];
	translations?: CountAggregatorConfig["translations"];
}

function pickDefaultResolution(
	supportedResolutions: readonly Resolution[],
): Resolution {
	if (supportedResolutions.includes("daily")) {
		return "daily";
	}

	return supportedResolutions[0] ?? "daily";
}

function createAppConfigForStationType(
	entry: StationTypeSummary,
	apiBaseUrl: string,
): CountAggregatorAppConfig {
	const stationType = entry.type as StationType;
	const isBicycleCount = stationType === "bicycleCount";
	const availableMetrics = entry.metrics.flatMap(
		(metric) => metric.aggregation,
	);
	const uniqueMetrics = [
		...new Set(
			availableMetrics.length > 0
				? availableMetrics
				: [entry.defaultMetric],
		),
	] as BucketMetric[];
	const defaultMetric = entry.defaultMetric;
	const defaultChartMetrics = [defaultMetric];
	const supportedResolutions = entry.supportedResolutions;

	return {
		id: stationType,
		apiBaseUrl,
		stationType,
		defaultMetric,
		availableMetrics: uniqueMetrics,
		defaultChartMetrics,
		uiVariant: isBicycleCount ? "stepped" : "single-page",
		defaultResolution: pickDefaultResolution(supportedResolutions),
		defaultChartType: isBicycleCount ? "area" : "line",
		resolutions: supportedResolutions,
		features: {
			resolutionSelect: true,
			chartTypeSelect: isBicycleCount,
			metricSelect: uniqueMetrics.length > 1,
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
		apps[entry.type] = createAppConfigForStationType(entry, apiBaseUrl);
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
