import {createElement} from "react";
import {type Root, createRoot} from "react-dom/client";

import {DEFAULT_PUBLIC_API_BASE_URL} from "../config/station-types.js";
import SmartCityMetricWidget from "./components/smart-city-metric-widget.js";
import {
	findMetricPlaceholders,
	parseMetricPlaceholder,
} from "./lib/parse-metric-placeholders.js";
import type {SmartCityMetricsOptions} from "./types.js";

const DETAILS_CONTENT_SELECTOR =
	".ms3-feature-details-content--html, .ms3-feature-details-content--description";
const mountedRoots = new Map<HTMLElement, Root>();

function findDetailsContentContainer(): Element | null {
	return (
		document.querySelector(
			".ms3-feature-selection-info__content .ms3-feature-details-content--html",
		) ??
		document.querySelector(
			".ms3-feature-selection-info__content .ms3-feature-details-content--description",
		) ??
		document.querySelector(DETAILS_CONTENT_SELECTOR)
	);
}

function unmountMetricPlaceholder(element: HTMLElement) {
	const root = mountedRoots.get(element);

	if (root) {
		root.unmount();
		mountedRoots.delete(element);
	}
}

function unmountAllMetricPlaceholders() {
	for (const element of [...mountedRoots.keys()]) {
		unmountMetricPlaceholder(element);
	}
}

export function mountSmartCityMetrics(
	container: ParentNode | null | undefined,
	options: SmartCityMetricsOptions = {},
) {
	if (!container) {
		unmountAllMetricPlaceholders();
		return;
	}

	const seen = new Set<HTMLElement>();

	for (const element of findMetricPlaceholders(container)) {
		const placeholder = parseMetricPlaceholder(element);

		if (!placeholder) {
			continue;
		}

		seen.add(element);
		unmountMetricPlaceholder(element);

		const root = createRoot(element);
		mountedRoots.set(element, root);

		root.render(
			createElement(SmartCityMetricWidget, {
				...placeholder,
				apiBaseUrl: options.apiBaseUrl ?? DEFAULT_PUBLIC_API_BASE_URL,
				showMetricIcons: options.showMetricIcons ?? false,
				getDataViewHref: options.getDataViewHref,
				dataViewLabel: options.dataViewLabel,
				getDownloadWizardHref: options.getDownloadWizardHref,
				downloadWizardLabel: options.downloadWizardLabel,
			}),
		);
	}

	for (const element of [...mountedRoots.keys()]) {
		if (!seen.has(element)) {
			unmountMetricPlaceholder(element);
		}
	}
}

export function createSmartCityMetricsPartialContentHandler(
	options: SmartCityMetricsOptions = {},
): EventListener {
	return function handleSmartCityMetricsPartialContentChange() {
		const container = findDetailsContentContainer();
		mountSmartCityMetrics(container, options);
	};
}

export {
	DEFAULT_METRIC_WIDGETS,
	applyStationTypeDisplay,
	resolveMetricWidgetConfig,
} from "./config/metric-widgets.js";
export type {
	MetricPlaceholderData,
	MetricWidgetConfig,
	MetricWidgetKind,
	SmartCityMetricsOptions,
} from "./types.js";
