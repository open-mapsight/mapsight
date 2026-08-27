import {airQualityIndexBandLabel} from "@mapsight/count-aggregator-api";

import {
	type MetricValueFormat,
	formatMetricAxisValue,
	formatMetricValue,
} from "../../lib/format-metric-value.js";
import {resolveCountAggregatorLocale} from "../../lib/i18n.js";
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
		timeZone: "UTC",
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

export function formatMetricTooltipTime(
	date: Date,
	resolution?: MetricWidgetConfig["resolution"],
): string {
	const locale = getDocumentLocale();

	if (
		resolution === "5min" ||
		resolution === "15min" ||
		resolution === "hourly"
	) {
		return new Intl.DateTimeFormat(locale, {
			timeZone: "UTC",
			day: "2-digit",
			month: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);
	}

	if (resolution === "monthly") {
		return new Intl.DateTimeFormat(locale, {
			timeZone: "UTC",
			month: "long",
			year: "numeric",
		}).format(date);
	}

	if (resolution === "yearly") {
		return new Intl.DateTimeFormat(locale, {
			timeZone: "UTC",
			year: "numeric",
		}).format(date);
	}

	return new Intl.DateTimeFormat(locale, {
		timeZone: "UTC",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(date);
}

export function formatMetricTooltipValue(
	value: number,
	config: MetricWidgetConfig,
): string {
	if (config.variant === "airQualityIndex") {
		const locale = resolveCountAggregatorLocale(getDocumentLocale());
		const band = airQualityIndexBandLabel(value, locale);
		const index = formatMetricAxisValueFromConfig(value, config);

		return band === undefined ? index : `${index} · ${band}`;
	}

	return formatMetricValueFromConfig(value, config);
}
