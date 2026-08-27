/**
 * Data-layer entry: hooks, config, i18n helpers, chart prep — no CSS and no
 * styled wizard/chart components. Host apps still wrap with
 * `CountAggregatorProvider` (exported here) plus their own `QueryClientProvider`.
 */

export {
	CountAggregatorProvider,
	useAppConfig,
	useCountAggregatorConfig,
	useCountAggregatorI18n,
} from "./context/count-aggregator-provider.js";

export {
	createStationTypeAppsConfig,
	DEFAULT_PUBLIC_API_BASE_URL,
	type StationTypeAppsConfigOptions,
} from "./config/station-types.js";

export {
	useStationTypes,
	useStationTypesQuery,
	useStations,
	useStationsQuery,
	useLastValues,
	useAggregatedValues,
	useTrafficEvents,
	usePresets,
	usePresetsQuery,
} from "./api/hooks.js";

export {
	applyPresetDateRanges,
	parsePresetsResponse,
} from "./config/platform.js";

export {
	prepareChartValues,
	DATA_LIMIT,
} from "./components/charts/time-series-chart.js";

export {dateToYmd, ymdToDate} from "./lib/dates.js";
export {
	getCountAggregatorDictionary,
	getResolutionLabels,
	resolveCountAggregatorLocale,
	type CountAggregatorLocale,
	type CountAggregatorTranslationKey,
	type CountAggregatorTranslations,
} from "./lib/i18n.js";
export {getColorForStationIndex, STATION_COLORS} from "./lib/colors.js";
export {
	mapDataValuePointsToChartPoints,
	mapTimeSeriesToChartPoints,
} from "./lib/time-series.js";
export {parseTrafficEventsResponse} from "./lib/utils.js";

export type * from "./types/index.js";
