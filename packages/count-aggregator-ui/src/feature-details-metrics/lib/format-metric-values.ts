import {
	type Resolution,
	airQualityIndexBandLabel,
} from "@mapsight/count-aggregator-api";

import {
	type MetricValueFormat,
	formatMetricAxisValue,
	formatMetricValue,
} from "../../lib/format-metric-value.js";
import {resolveCountAggregatorLocale} from "../../lib/i18n.js";
import {getDocumentLocale} from "../../lib/utils.js";
import type {MetricWidgetConfig} from "../types.js";

/** Treat a series as calendar-day ticks when buckets are about a day or coarser. */
const COARSE_AXIS_INTERVAL_MS = 20 * 60 * 60 * 1000;

export type MetricAxisTimeKind = "clock" | "date" | "month" | "year";

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

function medianPositiveDelta(timestamps: readonly number[]): number | null {
	const sorted = [...timestamps].sort((left, right) => left - right);
	const deltas: number[] = [];

	for (let index = 1; index < sorted.length; index++) {
		const delta = sorted[index]! - sorted[index - 1]!;
		if (delta > 0) {
			deltas.push(delta);
		}
	}

	if (deltas.length === 0) {
		return null;
	}

	deltas.sort((left, right) => left - right);

	return deltas[Math.floor(deltas.length / 2)] ?? null;
}

function looksLikeCoarseSeries(timestamps: readonly number[] | undefined): boolean {
	if (timestamps === undefined || timestamps.length < 2) {
		return false;
	}

	const medianDelta = medianPositiveDelta(timestamps);

	return medianDelta !== null && medianDelta >= COARSE_AXIS_INTERVAL_MS;
}

export function resolveMetricAxisTimeKind(
	resolution?: Resolution,
	timestamps?: readonly number[],
): MetricAxisTimeKind {
	if (resolution === "yearly") {
		return "year";
	}

	if (resolution === "monthly") {
		return "month";
	}

	if (resolution === "daily" || resolution === "weekly") {
		return "date";
	}

	if (
		resolution === "5min" ||
		resolution === "15min" ||
		resolution === "hourly"
	) {
		return looksLikeCoarseSeries(timestamps) ? "date" : "clock";
	}

	return looksLikeCoarseSeries(timestamps) ? "date" : "clock";
}

export function formatMetricAxisTime(
	date: Date,
	resolution?: Resolution,
	timestamps?: readonly number[],
): string {
	const locale = getDocumentLocale();
	const kind = resolveMetricAxisTimeKind(resolution, timestamps);

	if (kind === "year") {
		return new Intl.DateTimeFormat(locale, {
			timeZone: "UTC",
			year: "numeric",
		}).format(date);
	}

	if (kind === "month") {
		return new Intl.DateTimeFormat(locale, {
			timeZone: "UTC",
			month: "short",
			year: "2-digit",
		}).format(date);
	}

	if (kind === "date") {
		return new Intl.DateTimeFormat(locale, {
			timeZone: "UTC",
			day: "2-digit",
			month: "2-digit",
		}).format(date);
	}

	return new Intl.DateTimeFormat(locale, {
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
