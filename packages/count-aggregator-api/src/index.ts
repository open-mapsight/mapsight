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
	getRawValues,
	getStationLastValues,
	getStationSums,
	getValues,
	getValuesQuery,
	listStations,
	listStationTypes,
	type LastValuesRequest,
	type ListStationsOptions,
	type RawValuesRequest,
	type StationLastValuesRequest,
	type ValuesQueryRequest,
	type ValuesRequest,
} from "./helpers.js";
export {
	assertLocalDateTimeFields,
	LOCAL_DATE_TIME_PATTERN,
	parseLocalDateTime,
} from "./lib/datetime.js";
export {
	resolveStationTypeDisplay,
	type StationTypeDisplay,
} from "./lib/station-type-display.js";
export {
	indexTimeSeriesByStationId,
	parseTimeSeriesMap,
} from "./lib/responses.js";
export {
	buildCsvExportUrl,
	buildLastValuesCsvExportUrl,
	buildMultipleLastValuesUrl,
	buildMultipleValuesQueryUrl,
	buildMultipleValuesUrl,
	buildRawValuesCsvExportUrl,
	buildRawValuesUrl,
	buildSingleStationLastValuesUrl,
	buildSingleStationValuesUrl,
	buildStationSumsUrl,
	buildStationsGeoJsonUrl,
	buildStationsUrl,
	buildValuesQueryCsvExportUrl,
	type MultipleLastValuesRequest,
	type MultipleValuesQueryRequest,
	type MultipleValuesRequest,
	type MultipleRawValuesRequest,
	type SingleStationLastValuesRequest,
	type SingleStationValuesRequest,
} from "./lib/urls.js";

export type {
	BucketMetric,
	DataValuePoint,
	DetectedDataProblem,
	IsoDate,
	LastValuesAnchor,
	LocalDateTime,
	ProblemsListResponse,
	RawValuePoint,
	RawValuesMapResponse,
	RawValuesResponse,
	Resolution,
	ResponseFormat,
	StationListResponse,
	StationOverviewResponse,
	StationMetric,
	StationSummary,
	StationType,
	StationTypeCategory,
	StationTypeListResponse,
	StationTypeSummary,
	TimeSeriesMapResponse,
	TimeSeriesResponse,
} from "./types.js";
