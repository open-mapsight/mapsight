import {
	type MetricValueFormat,
	formatMetricAxisValue,
	formatMetricValue,
} from "../../lib/format-metric-value.js";
import {getDocumentLocale} from "../../lib/utils.js";
import type {MetricWidgetConfig} from "../types.js";

function toMetricValueFormat(config: MetricWidgetConfig): MetricValueFormat {
	return {
		displayPrecision: config.decimals ?? 0,
		unit: config.unit ?? null,
	};
}

export function formatMetricValueFromConfig(
	value: number,
	config: MetricWidgetConfig,
): string {
	return formatMetricValue(
		value,
		toMetricValueFormat(config),
		getDocumentLocale(),
	);
}

export function formatMetricAxisValueFromConfig(
	value: number,
	config: MetricWidgetConfig,
): string {
	return formatMetricAxisValue(
		value,
		toMetricValueFormat(config),
		getDocumentLocale(),
	);
}

export function formatMetricDate(date: Date | null): string {
	if (!date) {
		return "–";
	}

	return new Intl.DateTimeFormat(getDocumentLocale(), {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(date);
}

export function formatMetricAxisTime(date: Date): string {
	return new Intl.DateTimeFormat(getDocumentLocale(), {
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}
