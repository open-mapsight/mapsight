export {
	CountAggregatorProvider,
	useAppConfig,
	useCountAggregatorConfig,
	useCountAggregatorI18n,
} from "./context/count-aggregator-provider.js";

export {
	CountAggregatorRoot,
	useCountAggregatorPortal,
	useCountAggregatorRootElement,
} from "./context/count-aggregator-root.js";

export {
	CountAggregatorShell,
	type CountAggregatorShellProps,
} from "./context/count-aggregator-shell.js";

export {createTheme, type CountAggregatorTheme} from "./lib/theme.js";
export {
	getCountAggregatorDictionary,
	resolveCountAggregatorLocale,
	type CountAggregatorLocale,
	type CountAggregatorTranslationKey,
	type CountAggregatorTranslations,
} from "./lib/i18n.js";
export {smartCityCountAggregatorTheme} from "./themes/smart-city.js";

export {applyPresetDateRanges} from "./config/platform.js";

export {
	createStationTypeAppsConfig,
	DEFAULT_PUBLIC_API_BASE_URL,
	type StationTypeAppsConfigOptions,
} from "./config/station-types.js";

export {
	useStationTypes,
	useStationTypesQuery,
	useStationTypeCounts,
	useStations,
	useStationsQuery,
	useLastValues,
	useAggregatedValues,
	useTrafficEvents,
	usePresets,
	usePresetsQuery,
} from "./api/hooks.js";

export {CountAggregatorWizard} from "./components/apps/count-aggregator-wizard.js";

export {
	TimeSeriesChart,
	prepareChartValues,
} from "./components/charts/time-series-chart.js";

export {
	OverviewChartPanel,
	type OverviewChartConfig,
} from "./components/charts/overview-chart-panel.js";

export {
	formatMetricAxisValue,
	formatMetricValue,
	metricValueFormatFromAppConfig,
	type MetricValueFormat,
} from "./lib/format-metric-value.js";
export {getColorForStationIndex, STATION_COLORS} from "./lib/colors.js";
export {dateToYmd, ymdToDate} from "./lib/dates.js";
export {formatStationLabel} from "./lib/stations.js";
export {
	groupStationTypesByCategory,
	type StationTypeCategoryGroup,
} from "./lib/station-type-categories.js";

export {
	COUNT_AGGREGATOR_DATA_VIEW_REQUEST_EVENT,
	dispatchCountAggregatorDataViewRequest,
	type CountAggregatorDataViewRequestDetail,
} from "./events/data-view-request.js";

export {
	createSmartCityMetricsPartialContentHandler,
	mountSmartCityMetrics,
	DEFAULT_METRIC_WIDGETS,
	applyStationTypeDisplay,
	resolveMetricWidgetConfig,
	type MetricPlaceholderData,
	type MetricWidgetConfig,
	type MetricWidgetKind,
	type SmartCityMetricsOptions,
} from "./feature-details-metrics/index.js";
export {
	resolveStationTypeDisplay,
	type StationTypeDisplay,
} from "@mapsight/count-aggregator-api";

export {createSmartCityMetricsPartialContentPlugin} from "./plugins/smart-city-metrics-partial-content.js";
export type {SmartCityMetricsPartialContentPluginOptions} from "./plugins/smart-city-metrics-partial-content.js";

export type * from "./types/index.js";
