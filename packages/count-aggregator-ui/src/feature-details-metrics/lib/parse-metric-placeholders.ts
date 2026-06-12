import type {StationType} from "@mapsight/count-aggregator-api";

import type {MetricPlaceholderData} from "../types.js";

const PLACEHOLDER_SELECTOR = ".js-ms3-smart-city-metric";

function readRequiredAttribute(
	element: HTMLElement,
	name: string,
): string | null {
	const value = element.getAttribute(name)?.trim();

	return value ? value : null;
}

export function parseMetricPlaceholder(
	element: HTMLElement,
): MetricPlaceholderData | null {
	const stationType = readRequiredAttribute(
		element,
		"data-ms3-station-type",
	) as StationType | null;
	const stationId = readRequiredAttribute(element, "data-ms3-station-id");
	const label =
		readRequiredAttribute(element, "data-ms3-station-label") ??
		readRequiredAttribute(element, "data-ms3-metric-label");

	if (!stationType || !stationId || !label) {
		return null;
	}

	return {
		stationType,
		stationId,
		label,
		mapsightIconId:
			readRequiredAttribute(element, "data-ms3-mapsight-icon-id") ??
			undefined,
	};
}

export function findMetricPlaceholders(container: ParentNode): HTMLElement[] {
	return Array.from(container.querySelectorAll(PLACEHOLDER_SELECTOR)).filter(
		(element): element is HTMLElement => element instanceof HTMLElement,
	);
}
