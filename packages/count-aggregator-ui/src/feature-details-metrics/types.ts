import type {Resolution, StationType} from "@mapsight/count-aggregator-api";

export type MetricWidgetKind = "timeSeries" | "sumTotal" | "sumLastDay";

export type MetricChartType = "area" | "line";

export interface MetricWidgetConfig {
	kind: MetricWidgetKind;
	resolution?: Resolution;
	limit?: number;
	chartType?: MetricChartType;
	decimals?: number;
	valueScale?: number;
	unit?: string;
}

export interface MetricPlaceholderData {
	stationType: StationType;
	stationId: string;
	label: string;
	mapsightIconId?: string;
}

export interface SmartCityMetricsOptions {
	apiBaseUrl?: string;
	showMetricIcons?: boolean;
}

export interface MetricSeriesPoint {
	date: Date;
	value: number;
}
