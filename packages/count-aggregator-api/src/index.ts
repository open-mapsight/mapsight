export {endpoints, schemas} from "./generated/client.js";

export {
	createCountAggregatorClient,
	type CountAggregatorClient,
} from "./client.js";
export {
	CountAggregatorApiError,
	type FetchClientOptions,
} from "./lib/fetch-client.js";
export {
	getLastValues,
	getStationLastValues,
	getStationSums,
	getValues,
	listStations,
	listStationTypes,
	type LastValuesRequest,
	type ListStationsOptions,
	type StationLastValuesRequest,
	type ValuesRequest,
} from "./helpers.js";
export {
	assertLocalDateTimeFields,
	LOCAL_DATE_TIME_PATTERN,
	parseLocalDateTime,
} from "./lib/datetime.js";
export {
	indexTimeSeriesByStationId,
	parseTimeSeriesMap,
} from "./lib/responses.js";
export {
	buildCsvExportUrl,
	buildLastValuesCsvExportUrl,
	buildMultipleLastValuesUrl,
	buildMultipleValuesUrl,
	buildSingleStationLastValuesUrl,
	buildSingleStationValuesUrl,
	buildStationSumsUrl,
	buildStationsGeoJsonUrl,
	buildStationsUrl,
	type MultipleLastValuesRequest,
	type MultipleValuesRequest,
	type SingleStationLastValuesRequest,
	type SingleStationValuesRequest,
} from "./lib/urls.js";

export type {
	DataValuePoint,
	DetectedDataProblem,
	IsoDate,
	LastValuesAnchor,
	LocalDateTime,
	ProblemsListResponse,
	Resolution,
	ResponseFormat,
	StationListResponse,
	StationOverviewResponse,
	StationSummary,
	StationType,
	StationTypeListResponse,
	StationTypeSummary,
	TimeSeriesMapResponse,
	TimeSeriesResponse,
} from "./types.js";
