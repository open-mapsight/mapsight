import type {MetricWidgetConfig} from "../types.js";

function getDocumentLocale(): string {
	return document.documentElement.lang || "de-DE";
}

export function formatMetricValue(
	value: number,
	config: MetricWidgetConfig,
): string {
	const decimals = config.decimals ?? 0;

	return new Intl.NumberFormat(getDocumentLocale(), {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(value);
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
