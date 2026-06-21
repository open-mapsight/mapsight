import type {BucketMetric, Resolution} from "@mapsight/count-aggregator-api";

import {getDocumentLocale} from "./utils.js";

export type CountAggregatorLocale = "de" | "en";

export type CountAggregatorTranslationKey =
	| "calendar.end"
	| "calendar.open"
	| "calendar.start"
	| "chart.empty"
	| "chartType.area"
	| "chartType.column"
	| "chartType.note"
	| "chartType.select"
	| "csv.disabled"
	| "csv.download"
	| "dateRange.currentMonth"
	| "dateRange.currentYear"
	| "dateRange.from"
	| "dateRange.last30Days"
	| "dateRange.last7Days"
	| "dateRange.lastMonth"
	| "dateRange.lastYear"
	| "dateRange.section"
	| "dateRange.suggestions"
	| "dateRange.today"
	| "dateRange.toInclusive"
	| "events.allDay"
	| "events.empty"
	| "events.error"
	| "events.loading"
	| "events.section"
	| "metrics.emptySeries"
	| "metrics.emptyValue"
	| "metrics.error"
	| "metric.last"
	| "metric.max"
	| "metric.mean"
	| "metric.min"
	| "metric.section"
	| "metric.sum"
	| "metrics.loading"
	| "presets.delete"
	| "presets.empty"
	| "presets.placeholder"
	| "resolution.5min"
	| "resolution.15min"
	| "resolution.daily"
	| "resolution.hourly"
	| "resolution.monthly"
	| "resolution.section"
	| "resolution.weekly"
	| "resolution.yearly"
	| "result.changeSelection"
	| "result.chartSection"
	| "result.dateRange"
	| "result.downloadSection"
	| "result.editSelection"
	| "result.emptyLegend"
	| "result.interval"
	| "result.invalidDateRange"
	| "result.legendSection"
	| "result.noStations"
	| "result.selectedStations"
	| "result.selectionSection"
	| "result.toSelection"
	| "result.tooMuchData"
	| "result.tooMuchDataWithExport"
	| "station.addAll"
	| "station.noOptions"
	| "station.placeholder"
	| "station.placeholderBicycle"
	| "station.reset"
	| "station.section"
	| "station.sectionBicycle"
	| "step.chart"
	| "step.selection"
	| "wizard.next";

export type CountAggregatorTranslations = Record<
	CountAggregatorTranslationKey,
	string
>;

const de: CountAggregatorTranslations = {
	"calendar.end": "Zum Kalender (Enddatum)",
	"calendar.open": "Zum Kalender",
	"calendar.start": "Zum Kalender (Startdatum)",
	"chart.empty": "Für die aktuelle Auswahl sind keine Messwerte verfügbar.",
	"chartType.area": "Flächendiagramm",
	"chartType.column": "Balkendiagramm",
	"chartType.note":
		"*) Bei vielen Datenpunkten ist die Darstellung als Balkendiagramm nicht sinnvoll.",
	"chartType.select": "Diagrammtyp:",
	"csv.disabled":
		"CSV-Export ist erst verfügbar, wenn die Auswahl gültig ist.",
	"csv.download": "Als CSV-Datei herunterladen",
	"dateRange.currentMonth": "Laufender Monat",
	"dateRange.currentYear": "Laufendes Jahr",
	"dateRange.from": "Vom",
	"dateRange.last30Days": "Letzte 30 Tage",
	"dateRange.last7Days": "Letzte 7 Tage",
	"dateRange.lastMonth": "Letzter Monat",
	"dateRange.lastYear": "Letztes Jahr",
	"dateRange.section": "Zeitraum",
	"dateRange.suggestions": "Vorschläge:",
	"dateRange.today": "Heute",
	"dateRange.toInclusive": "bis einschließlich",
	"events.allDay": "(ganztägig)",
	"events.empty": "Keine Einträge",
	"events.error": "Fehler beim Abrufen…",
	"events.loading": "Lädt…",
	"events.section": "Verkehrsereignisse im gewählten Zeitraum",
	"metrics.emptySeries": "Keine Messwerte verfügbar",
	"metrics.emptyValue": "Kein Messwert verfügbar",
	"metrics.error": "Messwerte konnten nicht geladen werden",
	"metrics.loading": "Lade Messwerte …",
	"metric.last": "Letzter Wert",
	"metric.max": "Maximum",
	"metric.mean": "Durchschnitt",
	"metric.min": "Minimum",
	"metric.section": "Werte",
	"metric.sum": "Summe",
	"presets.delete": "Voreinstellung löschen…",
	"presets.empty": "Keine Voreinstellungen",
	"presets.placeholder": "Voreinstellung…",
	"resolution.5min": "5 Minuten",
	"resolution.15min": "15 Minuten",
	"resolution.daily": "Tag",
	"resolution.hourly": "Stunde",
	"resolution.monthly": "Monat",
	"resolution.section": "Auflösung",
	"resolution.weekly": "Woche",
	"resolution.yearly": "Jahr",
	"result.changeSelection": "Auswahl ändern",
	"result.chartSection": "Diagramm",
	"result.dateRange": "Gewählter Zeitraum:",
	"result.downloadSection": "Download",
	"result.editSelection": "Zurück zur Auswahl",
	"result.emptyLegend": "Keine Messstellen gewählt",
	"result.interval": "Gewählter Intervall:",
	"result.invalidDateRange": "Das Enddatum liegt vor dem Startdatum!",
	"result.legendSection": "Legende",
	"result.noStations":
		"Keine Messstellen ausgewählt. Bitte wählen Sie mindestens eine Messstelle.",
	"result.selectedStations": "Gewählte Messstellen:",
	"result.selectionSection": "Auswahl",
	"result.toSelection": "Zurück zur Auswahl",
	"result.tooMuchData":
		"Hinweis: Die Diagrammdarstellung wurde auf 5.000 Datenpunkte (über die Stationen verteilt) begrenzt.",
	"result.tooMuchDataWithExport":
		"Bitte nutzen Sie den Download-Link für den vollständigen Datensatz.",
	"station.addAll": "Alle hinzufügen",
	"station.noOptions": "Keine Messstellen gefunden",
	"station.placeholder": "Messstellen auswählen …",
	"station.placeholderBicycle": "Radzählstationen auswählen …",
	"station.reset": "Zurücksetzen",
	"station.section": "Messstellen",
	"station.sectionBicycle": "Radzählstationen",
	"step.chart": "2. Diagramm & Download",
	"step.selection": "1. Auswahl",
	"wizard.next": "Weiter",
};

const en: CountAggregatorTranslations = {
	"calendar.end": "Open calendar (end date)",
	"calendar.open": "Open calendar",
	"calendar.start": "Open calendar (start date)",
	"chart.empty": "No measurements are available for the current selection.",
	"chartType.area": "Area chart",
	"chartType.column": "Bar chart",
	"chartType.note":
		"*) For many data points, rendering as a bar chart is not useful.",
	"chartType.select": "Chart type:",
	"csv.disabled": "CSV export is available once the selection is valid.",
	"csv.download": "Download as CSV file",
	"dateRange.currentMonth": "Current month",
	"dateRange.currentYear": "Current year",
	"dateRange.from": "From",
	"dateRange.last30Days": "Last 30 days",
	"dateRange.last7Days": "Last 7 days",
	"dateRange.lastMonth": "Last month",
	"dateRange.lastYear": "Last year",
	"dateRange.section": "Date range",
	"dateRange.suggestions": "Suggestions:",
	"dateRange.today": "Today",
	"dateRange.toInclusive": "to and including",
	"events.allDay": "(all day)",
	"events.empty": "No entries",
	"events.error": "Failed to load…",
	"events.loading": "Loading…",
	"events.section": "Traffic events in the selected period",
	"metrics.emptySeries": "No measurements available",
	"metrics.emptyValue": "No measurement available",
	"metrics.error": "Measurements could not be loaded",
	"metrics.loading": "Loading measurements …",
	"metric.last": "Last value",
	"metric.max": "Maximum",
	"metric.mean": "Average",
	"metric.min": "Minimum",
	"metric.section": "Values",
	"metric.sum": "Sum",
	"presets.delete": "Delete preset…",
	"presets.empty": "No presets",
	"presets.placeholder": "Preset…",
	"resolution.5min": "5 minutes",
	"resolution.15min": "15 minutes",
	"resolution.daily": "Day",
	"resolution.hourly": "Hour",
	"resolution.monthly": "Month",
	"resolution.section": "Resolution",
	"resolution.weekly": "Week",
	"resolution.yearly": "Year",
	"result.changeSelection": "Change selection",
	"result.chartSection": "Chart",
	"result.dateRange": "Selected date range:",
	"result.downloadSection": "Download",
	"result.editSelection": "Back to selection",
	"result.emptyLegend": "No stations selected",
	"result.interval": "Selected interval:",
	"result.invalidDateRange": "The end date is before the start date!",
	"result.legendSection": "Legend",
	"result.noStations":
		"No stations selected. Please select at least one station.",
	"result.selectedStations": "Selected stations:",
	"result.selectionSection": "Selection",
	"result.toSelection": "Back to selection",
	"result.tooMuchData":
		"Note: The chart display has been limited to 5,000 data points distributed across the stations.",
	"result.tooMuchDataWithExport":
		"Please use the download link for the complete data set.",
	"station.addAll": "Add all",
	"station.noOptions": "No stations found",
	"station.placeholder": "Select stations …",
	"station.placeholderBicycle": "Select bicycle count stations …",
	"station.reset": "Reset",
	"station.section": "Stations",
	"station.sectionBicycle": "Bicycle count stations",
	"step.chart": "2. Chart & download",
	"step.selection": "1. Selection",
	"wizard.next": "Next",
};

const DICTIONARIES: Record<CountAggregatorLocale, CountAggregatorTranslations> =
	{de, en};

export function resolveCountAggregatorLocale(
	locale: string | undefined,
): CountAggregatorLocale {
	const candidate = (locale ?? getDocumentLocale()).toLowerCase();
	return candidate.startsWith("en") ? "en" : "de";
}

export function getCountAggregatorDictionary(
	locale: CountAggregatorLocale,
): CountAggregatorTranslations {
	return DICTIONARIES[locale];
}

export function getResolutionLabels(
	translate: (key: CountAggregatorTranslationKey) => string,
): Record<Resolution, string> {
	return {
		"5min": translate("resolution.5min"),
		"15min": translate("resolution.15min"),
		hourly: translate("resolution.hourly"),
		daily: translate("resolution.daily"),
		weekly: translate("resolution.weekly"),
		monthly: translate("resolution.monthly"),
		yearly: translate("resolution.yearly"),
	};
}

export function getMetricLabels(
	translate: (key: CountAggregatorTranslationKey) => string,
): Record<BucketMetric, string> {
	return {
		sum: translate("metric.sum"),
		mean: translate("metric.mean"),
		min: translate("metric.min"),
		max: translate("metric.max"),
		last: translate("metric.last"),
	};
}
