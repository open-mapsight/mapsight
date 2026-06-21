import type {
	BucketMetric,
	Resolution,
	StationType,
} from "@mapsight/count-aggregator-api";

import type {
	CountAggregatorLocale,
	CountAggregatorTranslationKey,
} from "../lib/i18n.js";

export type DataResolution = Resolution;

export type ChartType = "line" | "column" | "area";

export interface Station {
	id: number;
	typeName: string;
	status: string | null;
	label: string | null;
	originId: string;
	sectionDescription?: string;
}

export interface StationValue {
	date: Date;
	value: number;
}

export interface ChartSeries {
	key: string;
	stationId: number;
	metric: BucketMetric;
	values: StationValue[];
}

export interface StationData {
	stationId: number;
	values: StationValue[];
	valuesByMetric: Partial<Record<BucketMetric, StationValue[]>>;
}

export interface AggregatedValuesData {
	stationsById: Map<number, StationData>;
}

export interface ValuesRequest {
	stationIds: readonly number[];
	startDate: Date;
	endDate: Date;
	resolution?: Resolution;
	metrics?: readonly BucketMetric[];
}

export interface TrafficEvent {
	id: number;
	title: string;
	start_date: string;
	end_date: string;
	full_day: boolean;
	start_time: string | null;
	end_time: string | null;
}

export interface TrafficEventsData {
	manualEvents: TrafficEvent[];
}

export interface StationRef {
	id: number;
	isEnabled: boolean;
}

export interface DayDateRange {
	type: "day";
	date: Date;
}

export interface SpanDateRange {
	type: "range";
	startDate: Date;
	endDate: Date;
	dayClassFilter?: number[];
	weekdayFilter?: Record<string, boolean>;
}

export type DateRange = DayDateRange | SpanDateRange;

export interface PresetData {
	id: number;
	value: number;
	name: string;
	mainStationId: number;
	additionalStationRefs: StationRef[];
	additionalDateRanges: DateRange[];
}

/** Platform-only endpoints not yet in the count-aggregator OpenAPI contract. */
export interface CountAggregatorPlatformEndpoints {
	events?: string;
	presets?: string;
}

export interface CountAggregatorLinkBuilders {
	calendarUrl: (dateYmd: string) => string;
	eventUrl: (endDateYmd: string, eventId: number) => string;
}

export type UiVariant = "single-page" | "stepped";

export interface CountAggregatorFeatures {
	resolutionSelect?: boolean;
	chartTypeSelect?: boolean;
	metricSelect?: boolean;
	export?: boolean;
	presets?: boolean;
	events?: boolean;
}

export interface CountAggregatorAppConfig {
	id: string;
	apiBaseUrl: string;
	stationType: StationType;
	uiVariant?: UiVariant;
	defaultMetric?: BucketMetric;
	availableMetrics?: readonly BucketMetric[];
	defaultChartMetrics?: readonly BucketMetric[];
	primaryMetricLabel?: string;
	valueUnit?: string | null;
	displayPrecision?: number;
	defaultResolution?: Resolution;
	defaultChartType?: ChartType;
	resolutions?: readonly Resolution[];
	resolutionLabels?: Partial<Record<Resolution, string>>;
	features?: CountAggregatorFeatures;
	endpoints?: CountAggregatorPlatformEndpoints;
}

export interface CountAggregatorConfig {
	apps: Record<string, CountAggregatorAppConfig>;
	links: CountAggregatorLinkBuilders;
	locale?: CountAggregatorLocale;
	translations?: Partial<Record<CountAggregatorTranslationKey, string>>;
}

export interface TimeSeriesChartProps {
	type: ChartType;
	appId: string;
	selectedStationIds: readonly number[];
	selectedMetrics?: readonly BucketMetric[];
	chartSeries: ChartSeries[] | undefined;
	resolution: DataResolution;
	startDate: Date;
	endDate: Date;
	stationsById: Map<number, Station> | undefined;
	className?: string;
	emptyMessage?: string;
}

export type {BucketMetric, Resolution, StationType};
