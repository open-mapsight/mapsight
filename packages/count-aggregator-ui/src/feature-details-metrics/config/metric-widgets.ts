import type {StationType} from "@mapsight/count-aggregator-api";

import type {MetricWidgetConfig} from "../types.js";

const COUNT_STATION_TYPES = new Set<StationType>([
	"bicycleCount",
	"bicycleSensorTotal",
	"peopleCount",
]);

const WEATHER_STATION_TYPES = new Set<StationType>([
	"weatherAirPressure",
	"weatherHumidity",
	"weatherLightingDistance",
	"weatherLightnings",
	"weatherRain",
	"weatherSun",
	"weatherTemp",
	"weatherVaporPressure",
	"weatherWindSpeed",
	"weatherWindSpeedMax",
]);

const DEFAULT_TIME_SERIES: MetricWidgetConfig = {
	kind: "timeSeries",
	resolution: "daily",
	limit: 30,
	chartType: "area",
	decimals: 0,
};

const DEFAULT_WEATHER_TIME_SERIES: MetricWidgetConfig = {
	kind: "timeSeries",
	resolution: "15min",
	limit: 96,
	chartType: "area",
	decimals: 1,
};

const DEFAULT_WATER_TIME_SERIES: MetricWidgetConfig = {
	kind: "timeSeries",
	resolution: "hourly",
	limit: 48,
	chartType: "area",
	decimals: 2,
};

export const DEFAULT_METRIC_WIDGETS: Partial<
	Record<StationType, MetricWidgetConfig>
> = {
	bicycleCount: DEFAULT_TIME_SERIES,
	bicycleSensorTotal: DEFAULT_TIME_SERIES,
	peopleCount: DEFAULT_TIME_SERIES,
	waterLevelSurface: DEFAULT_WATER_TIME_SERIES,
	waterTemp: DEFAULT_WATER_TIME_SERIES,
	weatherAirPressure: DEFAULT_WEATHER_TIME_SERIES,
	weatherHumidity: DEFAULT_WEATHER_TIME_SERIES,
	weatherLightingDistance: DEFAULT_WEATHER_TIME_SERIES,
	weatherLightnings: DEFAULT_WEATHER_TIME_SERIES,
	weatherRain: DEFAULT_WEATHER_TIME_SERIES,
	weatherSun: DEFAULT_WEATHER_TIME_SERIES,
	weatherTemp: DEFAULT_WEATHER_TIME_SERIES,
	weatherVaporPressure: DEFAULT_WEATHER_TIME_SERIES,
	weatherWindSpeed: DEFAULT_WEATHER_TIME_SERIES,
	weatherWindSpeedMax: DEFAULT_WEATHER_TIME_SERIES,
	airQualityPM10: {
		kind: "timeSeries",
		resolution: "hourly",
		limit: 24,
		chartType: "area",
		decimals: 1,
	},
};

function matchesAny(haystack: string, needles: readonly string[]): boolean {
	const normalized = haystack.toLowerCase();

	return needles.some((needle) => normalized.includes(needle.toLowerCase()));
}

export function resolveMetricWidgetConfig(
	stationType: StationType,
	stationLabel: string,
): MetricWidgetConfig {
	if (stationType === "airQualityPM10") {
		if (matchesAny(stationLabel, ["gesamt", "total"])) {
			return {
				kind: "sumTotal",
				decimals: 3,
				valueScale: 1e-9,
			};
		}

		if (matchesAny(stationLabel, ["24h", "24 h"])) {
			return {
				kind: "sumLastDay",
				decimals: 4,
				valueScale: 1e-9,
			};
		}
	}

	if (COUNT_STATION_TYPES.has(stationType)) {
		return DEFAULT_METRIC_WIDGETS[stationType] ?? DEFAULT_TIME_SERIES;
	}

	if (WEATHER_STATION_TYPES.has(stationType)) {
		return (
			DEFAULT_METRIC_WIDGETS[stationType] ?? DEFAULT_WEATHER_TIME_SERIES
		);
	}

	return DEFAULT_METRIC_WIDGETS[stationType] ?? DEFAULT_TIME_SERIES;
}
