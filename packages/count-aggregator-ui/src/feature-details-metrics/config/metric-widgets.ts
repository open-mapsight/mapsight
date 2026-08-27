import type {
	StationType,
	StationTypeDisplay,
} from "@mapsight/count-aggregator-api";
import {
	isAirQualityIndexStationType,
	isAirQualityIndexUnit,
} from "@mapsight/count-aggregator-api";

import type {MetricWidgetConfig, MetricWidgetVariant} from "../types.js";

const COUNT_STATION_TYPES = new Set<StationType>([
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
	"weatherWindDirection",
	"weatherWindSpeed",
	"weatherWindSpeedMax",
]);

const WATER_STATION_TYPES = new Set<StationType>([
	"waterLevelStation",
	"waterLevelSurface",
	"waterLevelUnderground",
	"waterTemp",
]);

const AIR_QUALITY_CONCENTRATION_TYPES = new Set<StationType>([
	"airQualityCO",
	"airQualityNO2",
	"airQualityO3",
	"airQualityPM10",
	"airQualityPM25",
	"airQualitySO2",
	"airQualityStation",
]);

const DEFAULT_TIME_SERIES: MetricWidgetConfig = {
	kind: "timeSeries",
	resolution: "daily",
	limit: 30,
	chartType: "area",
	decimals: 0,
	variant: "default",
};

const DEFAULT_WEATHER_TIME_SERIES: MetricWidgetConfig = {
	kind: "timeSeries",
	resolution: "15min",
	limit: 96,
	chartType: "area",
	decimals: 1,
	variant: "default",
};

const DEFAULT_WATER_TIME_SERIES: MetricWidgetConfig = {
	kind: "timeSeries",
	resolution: "hourly",
	limit: 48,
	chartType: "area",
	decimals: 2,
	variant: "default",
};

const DEFAULT_AIR_QUALITY_TIME_SERIES: MetricWidgetConfig = {
	kind: "timeSeries",
	resolution: "hourly",
	limit: 24,
	chartType: "area",
	decimals: 0,
	variant: "default",
};

const DEFAULT_AIR_QUALITY_INDEX_TIME_SERIES: MetricWidgetConfig = {
	kind: "timeSeries",
	resolution: "hourly",
	limit: 24,
	chartType: "area",
	decimals: 0,
	variant: "airQualityIndex",
};

const DEFAULT_WIND_DIRECTION: MetricWidgetConfig = {
	kind: "timeSeries",
	resolution: "15min",
	limit: 96,
	chartType: "line",
	decimals: 0,
	variant: "windDirection",
};

export const DEFAULT_METRIC_WIDGETS: Partial<
	Record<StationType, MetricWidgetConfig>
> = {
	bicycleSensorTotal: DEFAULT_TIME_SERIES,
	peopleCount: DEFAULT_TIME_SERIES,
	waterLevelStation: DEFAULT_WATER_TIME_SERIES,
	waterLevelSurface: DEFAULT_WATER_TIME_SERIES,
	waterLevelUnderground: DEFAULT_WATER_TIME_SERIES,
	waterTemp: DEFAULT_WATER_TIME_SERIES,
	weatherAirPressure: DEFAULT_WEATHER_TIME_SERIES,
	weatherHumidity: DEFAULT_WEATHER_TIME_SERIES,
	weatherLightingDistance: DEFAULT_WEATHER_TIME_SERIES,
	weatherLightnings: DEFAULT_WEATHER_TIME_SERIES,
	weatherRain: DEFAULT_WEATHER_TIME_SERIES,
	weatherSun: DEFAULT_WEATHER_TIME_SERIES,
	weatherTemp: DEFAULT_WEATHER_TIME_SERIES,
	weatherVaporPressure: DEFAULT_WEATHER_TIME_SERIES,
	weatherWindDirection: DEFAULT_WIND_DIRECTION,
	weatherWindSpeed: DEFAULT_WEATHER_TIME_SERIES,
	weatherWindSpeedMax: DEFAULT_WEATHER_TIME_SERIES,
	airQualityCO: DEFAULT_AIR_QUALITY_TIME_SERIES,
	airQualityNO2: DEFAULT_AIR_QUALITY_TIME_SERIES,
	airQualityO3: DEFAULT_AIR_QUALITY_TIME_SERIES,
	airQualityPM10: {
		...DEFAULT_AIR_QUALITY_TIME_SERIES,
		decimals: 1,
	},
	airQualityPM25: DEFAULT_AIR_QUALITY_TIME_SERIES,
	airQualitySO2: DEFAULT_AIR_QUALITY_TIME_SERIES,
	airQualityStation: DEFAULT_AIR_QUALITY_TIME_SERIES,
	airQualityIndex: DEFAULT_AIR_QUALITY_INDEX_TIME_SERIES,
	airQualityNO2Index: DEFAULT_AIR_QUALITY_INDEX_TIME_SERIES,
	airQualityO3Index: DEFAULT_AIR_QUALITY_INDEX_TIME_SERIES,
	airQualityPM10Index: DEFAULT_AIR_QUALITY_INDEX_TIME_SERIES,
};

function matchesAny(haystack: string, needles: readonly string[]): boolean {
	const normalized = haystack.toLowerCase();

	return needles.some((needle) => normalized.includes(needle.toLowerCase()));
}

function variantForStationType(stationType: StationType): MetricWidgetVariant {
	if (
		isAirQualityIndexStationType(stationType) ||
		stationType.endsWith("Index")
	) {
		return "airQualityIndex";
	}

	if (stationType === "weatherWindDirection") {
		return "windDirection";
	}

	return "default";
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
				variant: "default",
			};
		}

		if (matchesAny(stationLabel, ["24h", "24 h"])) {
			return {
				kind: "sumLastDay",
				decimals: 4,
				valueScale: 1e-9,
				variant: "default",
			};
		}
	}

	const variant = variantForStationType(stationType);
	const configured = DEFAULT_METRIC_WIDGETS[stationType];

	if (configured !== undefined) {
		return {...configured, variant};
	}

	if (COUNT_STATION_TYPES.has(stationType)) {
		return {...DEFAULT_TIME_SERIES, variant};
	}

	if (WEATHER_STATION_TYPES.has(stationType)) {
		return {...DEFAULT_WEATHER_TIME_SERIES, variant};
	}

	if (WATER_STATION_TYPES.has(stationType)) {
		return {...DEFAULT_WATER_TIME_SERIES, variant};
	}

	if (
		AIR_QUALITY_CONCENTRATION_TYPES.has(stationType) ||
		stationType.startsWith("airQuality")
	) {
		return isAirQualityIndexStationType(stationType)
			? {...DEFAULT_AIR_QUALITY_INDEX_TIME_SERIES, variant}
			: {...DEFAULT_AIR_QUALITY_TIME_SERIES, variant};
	}

	return {...DEFAULT_TIME_SERIES, variant};
}

export function applyStationTypeDisplay(
	config: MetricWidgetConfig,
	display: StationTypeDisplay | undefined,
): MetricWidgetConfig {
	if (display === undefined) {
		return config;
	}

	const unit = isAirQualityIndexUnit(display.valueUnit)
		? undefined
		: (display.valueUnit ?? undefined);

	return {
		...config,
		decimals: display.displayPrecision,
		unit,
		variant:
			config.variant === "airQualityIndex" ||
			isAirQualityIndexUnit(display.valueUnit)
				? "airQualityIndex"
				: config.variant,
	};
}
