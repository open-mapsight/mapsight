import {getDocumentLocale} from "./utils.js";

export interface MetricValueFormat {
	displayPrecision: number;
	unit?: string | null;
}

export function formatMetricValue(
	value: number,
	format: MetricValueFormat,
	locale = getDocumentLocale(),
): string {
	const formatted = new Intl.NumberFormat(locale, {
		minimumFractionDigits: format.displayPrecision,
		maximumFractionDigits: format.displayPrecision,
	}).format(value);

	if (format.unit) {
		return `${formatted} ${format.unit}`;
	}

	return formatted;
}

export function formatMetricAxisValue(
	value: number,
	format: MetricValueFormat,
	locale = getDocumentLocale(),
): string {
	return new Intl.NumberFormat(locale, {
		maximumFractionDigits: format.displayPrecision,
	}).format(value);
}

export function metricValueFormatFromAppConfig(config: {
	displayPrecision?: number;
	valueUnit?: string | null;
}): MetricValueFormat {
	return {
		displayPrecision: config.displayPrecision ?? 0,
		unit: config.valueUnit ?? null,
	};
}
