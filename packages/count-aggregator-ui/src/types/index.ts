import type {Resolution, StationType} from "@mapsight/count-aggregator-api";

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

export interface StationData {
	stationId: number;
	values: StationValue[];
}

export interface AggregatedValuesData {
	stationsById: Map<number, StationData>;
}

export interface ValuesRequest {
	stationIds: readonly number[];
	startDate: Date;
	endDate: Date;
	resolution?: Resolution;
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

/** Platform-only legacy endpoints not yet in the count-aggregator OpenAPI contract. */
export interface CountAggregatorLegacyEndpoints {
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
	export?: boolean;
	presets?: boolean;
	events?: boolean;
}

export const DEFAULT_RESOLUTION_LABELS: Record<Resolution, string> = {
	"15min": "15 Minuten",
	hourly: "Stunde",
	daily: "Tag",
	weekly: "Woche",
	monthly: "Monat",
	yearly: "Jahr",
};

export type PlatformAppId = "traffic-data" | "smart-city" | "wheel-counter";

export interface CountAggregatorAppConfig {
	id: string;
	apiBaseUrl: string;
	stationType: StationType;
	uiVariant?: UiVariant;
	defaultResolution?: Resolution;
	defaultChartType?: ChartType;
	resolutions?: readonly Resolution[];
	resolutionLabels?: Partial<Record<Resolution, string>>;
	features?: CountAggregatorFeatures;
	endpoints?: CountAggregatorLegacyEndpoints;
	/** @deprecated Use `features.events` */
	showEvents?: boolean;
}

export interface CountAggregatorConfig {
	apps: Record<string, CountAggregatorAppConfig>;
	links: CountAggregatorLinkBuilders;
}

export interface TimeSeriesChartProps {
	type: ChartType;
	selectedStationIds: readonly number[];
	valuesByStationId: Map<number, StationValue[]> | undefined;
	resolution: DataResolution;
	startDate: Date;
	endDate: Date;
	stationsById: Map<number, Station> | undefined;
}

export type {Resolution, StationType};
