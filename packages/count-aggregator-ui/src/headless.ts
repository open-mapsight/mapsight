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
