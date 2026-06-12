import { z } from "zod";

type StationGeoJsonFeature = {
  type: string;
  geometry: StationGeoJsonPointGeometry;
  properties: StationGeoJsonFeatureProperties;
};
type StationGeoJsonPointGeometry = {
  type: string;
  /**
   * Longitude and latitude as `[lon, lat]` in WGS84 (EPSG:4326).
   */
  coordinates: Array<any>;
};
type StationGeoJsonFeatureProperties = {
  /**
   * Platform station id (database primary key).
   */
  id: string;
  /**
   * External origin id from the data source (e.g. Niotix twin id).
   */
  originId: string;
  name: string | null;
  /**
   * Station type identifier. See `GET /station-types` for currently available types.
   *
   * @enum airQualityCO, airQualityNO2, airQualityO3, airQualityPM10, airQualityPM25, airQualityStation, bicycleCount, bicycleSensorTotal, peopleCount, waterLevelSurface, waterTemp, weatherAirPressure, weatherHumidity, weatherLightingDistance, weatherLightnings, weatherRain, weatherStation, weatherSun, weatherTemp, weatherVaporPressure, weatherWindSpeed, weatherWindSpeedMax
   */
  type:
    | "airQualityCO"
    | "airQualityNO2"
    | "airQualityO3"
    | "airQualityPM10"
    | "airQualityPM25"
    | "airQualityStation"
    | "bicycleCount"
    | "bicycleSensorTotal"
    | "peopleCount"
    | "waterLevelSurface"
    | "waterTemp"
    | "weatherAirPressure"
    | "weatherHumidity"
    | "weatherLightingDistance"
    | "weatherLightnings"
    | "weatherRain"
    | "weatherStation"
    | "weatherSun"
    | "weatherTemp"
    | "weatherVaporPressure"
    | "weatherWindSpeed"
    | "weatherWindSpeedMax";
  /**
   * German human-readable type label. For grouped container stations: `Main Type: Sub Type, Sub Type 2`.
   */
  typeLabel: string;
  /**
   * Station tags assigned in the platform (e.g. parking area tags).
   */
  tags: Array<string>;
  /**
   * Whether the station has imported time series data.
   */
  hasData: boolean;
  /**
   * Grouped filter tags for the frontend, keyed by group name (e.g. `Art`).
   */
  tagGroups: Partial<{
    Art: {
      /**
       * When false, any listed tag matches (OR). When true, all listed tags must match (AND).
       */
      andJunction: boolean;
      tags: Array<string>;
    };
  }>;
  /**
   * Timestamp of the most recent data point (ISO 8601). Omitted when no data exists.
   */
  lastDataAt: string;
  /**
   * Font Awesome icon identifier from Niotix (e.g. fa-water). Omitted when no icon is configured.
   */
  mapsightIconId: string;
  legacyDashboardId: string;
  /**
   * Niotix station description. Omitted when not configured.
   */
  description: string;
  /**
   * Metric child stations grouped under this container (grouped mode only).
   */
  childStations: Array<{
    /**
     * Platform station id (database primary key).
     */
    id: string;
    /**
     * External origin id from the data source.
     */
    originId: string;
    name?: (string | null) | undefined;
    /**
     * Child station type identifier.
     */
    type: string;
    /**
     * German human-readable child type label.
     */
    typeLabel: string;
    stats?: /**
     * Precomputed counter stats for this metric child. Only present when `includeStats=true`.
     */
    | {
          /**
           * Lifetime sum of all counter values (same as `/sums` total).
           */
          total: number;
          /**
           * Daily totals for the last three days (same as `/sums` lastDays).
           */
          lastDays: Array<{
            /**
             * Local station datetime in `Y-m-d H:i:s` format (no timezone offset).
             */
            datetime: string;
            value: number;
          }>;
          /**
           * When these stats were precomputed (ISO 8601).
           */
          computedAt: string;
        }
      | undefined;
  }>;
  /**
   * Platform station id of the container station (flat mode only).
   */
  parentId: string;
  /**
   * Type of the container station (flat mode only).
   */
  parentType: string;
  /**
   * German human-readable label of the container station (flat mode only).
   */
  parentTypeLabel: string;
  /**
   * Precomputed counter stats. Only present when `includeStats=true`. Omitted when not yet cached.
   */
  stats: {
    /**
     * Lifetime sum of all counter values (same as `/sums` total).
     */
    total: number;
    /**
     * Daily totals for the last three days (same as `/sums` lastDays).
     */
    lastDays: Array<{
      /**
       * Local station datetime in `Y-m-d H:i:s` format (no timezone offset).
       */
      datetime: string;
      value: number;
    }>;
    /**
     * When these stats were precomputed (ISO 8601).
     */
    computedAt: string;
  };
};
type StationGeoJsonFeatureCollection = {
  type: string;
  features: Array<StationGeoJsonFeature>;
};
type StationListResponse = {
  data: Array<StationSummary>;
};
type StationSummary = {
  id: number;
  /**
   * Station type identifier. See `GET /station-types` for currently available types.
   *
   * @enum airQualityCO, airQualityNO2, airQualityO3, airQualityPM10, airQualityPM25, airQualityStation, bicycleCount, bicycleSensorTotal, peopleCount, waterLevelSurface, waterTemp, weatherAirPressure, weatherHumidity, weatherLightingDistance, weatherLightnings, weatherRain, weatherStation, weatherSun, weatherTemp, weatherVaporPressure, weatherWindSpeed, weatherWindSpeedMax
   */
  type:
    | "airQualityCO"
    | "airQualityNO2"
    | "airQualityO3"
    | "airQualityPM10"
    | "airQualityPM25"
    | "airQualityStation"
    | "bicycleCount"
    | "bicycleSensorTotal"
    | "peopleCount"
    | "waterLevelSurface"
    | "waterTemp"
    | "weatherAirPressure"
    | "weatherHumidity"
    | "weatherLightingDistance"
    | "weatherLightnings"
    | "weatherRain"
    | "weatherStation"
    | "weatherSun"
    | "weatherTemp"
    | "weatherVaporPressure"
    | "weatherWindSpeed"
    | "weatherWindSpeedMax";
  origin_id: string;
  name: string | null;
  /**
   * Most recent operational status reported for the station, or `null` when unavailable.
   */
  status: /**
   * Most recent operational status reported for the station, or `null` when unavailable.
   */
  | string
    /**
     * Most recent operational status reported for the station, or `null` when unavailable.
     */
    | null;
  label: string;
  hasData: boolean;
  lastDataAt: string | null;
};
type StationOverviewResponse = {
  stationId: number;
  total: number;
  lastDays: Array<DataValuePoint>;
  dailyAverage: Array<DataValuePoint>;
};
type DataValuePoint = {
  /**
   * Local station datetime in `Y-m-d H:i:s` format (no timezone offset).
   *
   * @pattern ^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$
   */
  datetime: string;
  value: number;
};
type StationTypeListResponse = {
  data: Array<StationTypeSummary>;
};
type StationTypeSummary = {
  /**
   * Station type identifier. See `GET /station-types` for currently available types.
   *
   * @enum airQualityCO, airQualityNO2, airQualityO3, airQualityPM10, airQualityPM25, airQualityStation, bicycleCount, bicycleSensorTotal, peopleCount, waterLevelSurface, waterTemp, weatherAirPressure, weatherHumidity, weatherLightingDistance, weatherLightnings, weatherRain, weatherStation, weatherSun, weatherTemp, weatherVaporPressure, weatherWindSpeed, weatherWindSpeedMax
   */
  type:
    | "airQualityCO"
    | "airQualityNO2"
    | "airQualityO3"
    | "airQualityPM10"
    | "airQualityPM25"
    | "airQualityStation"
    | "bicycleCount"
    | "bicycleSensorTotal"
    | "peopleCount"
    | "waterLevelSurface"
    | "waterTemp"
    | "weatherAirPressure"
    | "weatherHumidity"
    | "weatherLightingDistance"
    | "weatherLightnings"
    | "weatherRain"
    | "weatherStation"
    | "weatherSun"
    | "weatherTemp"
    | "weatherVaporPressure"
    | "weatherWindSpeed"
    | "weatherWindSpeedMax";
  label: string;
  station_count: number;
};
type TimeSeriesResponse = {
  id: number;
  /**
   * Local station datetime in `Y-m-d H:i:s` format (no timezone offset).
   *
   * @pattern ^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$
   */
  fromDateTime: string;
  /**
   * Local station datetime in `Y-m-d H:i:s` format (no timezone offset).
   *
   * @pattern ^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$
   */
  toDateTime: string;
  /**
   * Local station datetime in `Y-m-d H:i:s` format (no timezone offset).
   *
   * @pattern ^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$
   */
  lastDateTime: string;
  /**
   * Time bucket used to aggregate count values. Allowed values: `15min`, `hourly`, `daily`, `weekly`, `monthly`, `yearly`.
   *
   * @enum 15min, hourly, daily, weekly, monthly, yearly
   */
  resolution: "15min" | "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  stationId: string;
  values: Array<DataValuePoint>;
};

const StationGeoJsonPointGeometry: z.ZodType<StationGeoJsonPointGeometry> = z
  .object({ type: z.string(), coordinates: z.array(z.any()).min(2).max(2) })
  .strict()
  .passthrough();
const StationGeoJsonFeatureProperties: z.ZodType<StationGeoJsonFeatureProperties> =
  z
    .object({
      id: z.string(),
      originId: z.string(),
      name: z.union([z.string(), z.null()]),
      type: z.enum([
        "airQualityCO",
        "airQualityNO2",
        "airQualityO3",
        "airQualityPM10",
        "airQualityPM25",
        "airQualityStation",
        "bicycleCount",
        "bicycleSensorTotal",
        "peopleCount",
        "waterLevelSurface",
        "waterTemp",
        "weatherAirPressure",
        "weatherHumidity",
        "weatherLightingDistance",
        "weatherLightnings",
        "weatherRain",
        "weatherStation",
        "weatherSun",
        "weatherTemp",
        "weatherVaporPressure",
        "weatherWindSpeed",
        "weatherWindSpeedMax",
      ]),
      typeLabel: z.string(),
      tags: z.array(z.string()),
      hasData: z.boolean(),
      tagGroups: z
        .object({
          Art: z
            .object({ andJunction: z.boolean(), tags: z.array(z.string()) })
            .strict()
            .passthrough(),
        })
        .partial()
        .strict()
        .passthrough(),
      lastDataAt: z.string(),
      mapsightIconId: z.string(),
      legacyDashboardId: z.string(),
      description: z.string(),
      childStations: z.array(
        z
          .object({
            id: z.string(),
            originId: z.string(),
            name: z.union([z.string(), z.null()]).optional(),
            type: z.string(),
            typeLabel: z.string(),
            stats: z
              .object({
                total: z.number(),
                lastDays: z.array(
                  z
                    .object({ datetime: z.string(), value: z.number() })
                    .strict()
                    .passthrough()
                ),
                computedAt: z.string(),
              })
              .strict()
              .passthrough()
              .optional(),
          })
          .strict()
          .passthrough()
      ),
      parentId: z.string(),
      parentType: z.string(),
      parentTypeLabel: z.string(),
      stats: z
        .object({
          total: z.number(),
          lastDays: z.array(
            z
              .object({ datetime: z.string(), value: z.number() })
              .strict()
              .passthrough()
          ),
          computedAt: z.string(),
        })
        .strict()
        .passthrough(),
    })
    .strict()
    .passthrough();
const StationGeoJsonFeature: z.ZodType<StationGeoJsonFeature> = z
  .object({
    type: z.string(),
    geometry: StationGeoJsonPointGeometry,
    properties: StationGeoJsonFeatureProperties,
  })
  .strict()
  .passthrough();
const StationGeoJsonFeatureCollection: z.ZodType<StationGeoJsonFeatureCollection> =
  z
    .object({ type: z.string(), features: z.array(StationGeoJsonFeature) })
    .strict()
    .passthrough();
const StationTypeSummary: z.ZodType<StationTypeSummary> = z
  .object({
    type: z.enum([
      "airQualityCO",
      "airQualityNO2",
      "airQualityO3",
      "airQualityPM10",
      "airQualityPM25",
      "airQualityStation",
      "bicycleCount",
      "bicycleSensorTotal",
      "peopleCount",
      "waterLevelSurface",
      "waterTemp",
      "weatherAirPressure",
      "weatherHumidity",
      "weatherLightingDistance",
      "weatherLightnings",
      "weatherRain",
      "weatherStation",
      "weatherSun",
      "weatherTemp",
      "weatherVaporPressure",
      "weatherWindSpeed",
      "weatherWindSpeedMax",
    ]),
    label: z.string(),
    station_count: z.number().int(),
  })
  .strict()
  .passthrough();
const StationTypeListResponse: z.ZodType<StationTypeListResponse> = z
  .object({ data: z.array(StationTypeSummary) })
  .strict()
  .passthrough();
const StationSummary: z.ZodType<StationSummary> = z
  .object({
    id: z.number().int(),
    type: z.enum([
      "airQualityCO",
      "airQualityNO2",
      "airQualityO3",
      "airQualityPM10",
      "airQualityPM25",
      "airQualityStation",
      "bicycleCount",
      "bicycleSensorTotal",
      "peopleCount",
      "waterLevelSurface",
      "waterTemp",
      "weatherAirPressure",
      "weatherHumidity",
      "weatherLightingDistance",
      "weatherLightnings",
      "weatherRain",
      "weatherStation",
      "weatherSun",
      "weatherTemp",
      "weatherVaporPressure",
      "weatherWindSpeed",
      "weatherWindSpeedMax",
    ]),
    origin_id: z.string(),
    name: z.union([z.string(), z.null()]),
    status: z.union([z.string(), z.null()]),
    label: z.string(),
    hasData: z.boolean(),
    lastDataAt: z.union([z.string(), z.null()]),
  })
  .strict()
  .passthrough();
const StationListResponse: z.ZodType<StationListResponse> = z
  .object({ data: z.array(StationSummary) })
  .strict()
  .passthrough();
const DataValuePoint: z.ZodType<DataValuePoint> = z
  .object({
    datetime: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
    value: z.number(),
  })
  .strict()
  .passthrough();
const TimeSeriesResponse: z.ZodType<TimeSeriesResponse> = z
  .object({
    id: z.number().int(),
    fromDateTime: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
    toDateTime: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
    lastDateTime: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
    resolution: z.enum([
      "15min",
      "hourly",
      "daily",
      "weekly",
      "monthly",
      "yearly",
    ]),
    stationId: z.string(),
    values: z.array(DataValuePoint),
  })
  .strict()
  .passthrough();
const StationOverviewResponse: z.ZodType<StationOverviewResponse> = z
  .object({
    stationId: z.number().int(),
    total: z.number(),
    lastDays: z.array(DataValuePoint),
    dailyAverage: z.array(DataValuePoint),
  })
  .strict()
  .passthrough();
const DetectedDataProblem = z
  .object({
    type: z.string(),
    station_id: z.string(),
    start_datetime: z.string(),
    end_datetime: z.string(),
  })
  .strict()
  .passthrough();
const GeoJsonFeatureCollection = z
  .object({ type: z.string(), features: z.string() })
  .strict()
  .passthrough();

export const schemas = {
  StationGeoJsonPointGeometry,
  StationGeoJsonFeatureProperties,
  StationGeoJsonFeature,
  StationGeoJsonFeatureCollection,
  StationTypeSummary,
  StationTypeListResponse,
  StationSummary,
  StationListResponse,
  DataValuePoint,
  TimeSeriesResponse,
  StationOverviewResponse,
  DetectedDataProblem,
  GeoJsonFeatureCollection,
};

export const endpoints = [
  {
    method: "get",
    path: "/:type/:stationId/last-problems/:resolution",
    alias: "count-aggregator.public.type.station.last-problems",
    requestFormat: "json",
    parameters: [
      {
        name: "type",
        type: "Path",
        schema: z.enum([
          "airQualityCO",
          "airQualityNO2",
          "airQualityO3",
          "airQualityPM10",
          "airQualityPM25",
          "airQualityStation",
          "bicycleCount",
          "bicycleSensorTotal",
          "peopleCount",
          "waterLevelSurface",
          "waterTemp",
          "weatherAirPressure",
          "weatherHumidity",
          "weatherLightingDistance",
          "weatherLightnings",
          "weatherRain",
          "weatherStation",
          "weatherSun",
          "weatherTemp",
          "weatherVaporPressure",
          "weatherWindSpeed",
          "weatherWindSpeedMax",
        ]),
      },
      {
        name: "stationId",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "resolution",
        type: "Path",
        schema: z.enum([
          "15min",
          "hourly",
          "daily",
          "weekly",
          "monthly",
          "yearly",
        ]),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "startDate",
        type: "Query",
        schema: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      },
    ],
    response: DetectedDataProblem,
    errors: [
      {
        status: 404,
        description: `Station not found`,
        schema: z.null(),
      },
    ],
  },
  {
    method: "get",
    path: "/:type/:stationId/last-values/:resolution",
    alias: "count-aggregator.public.type.station.last-values",
    requestFormat: "json",
    parameters: [
      {
        name: "type",
        type: "Path",
        schema: z.enum([
          "airQualityCO",
          "airQualityNO2",
          "airQualityO3",
          "airQualityPM10",
          "airQualityPM25",
          "airQualityStation",
          "bicycleCount",
          "bicycleSensorTotal",
          "peopleCount",
          "waterLevelSurface",
          "waterTemp",
          "weatherAirPressure",
          "weatherHumidity",
          "weatherLightingDistance",
          "weatherLightnings",
          "weatherRain",
          "weatherStation",
          "weatherSun",
          "weatherTemp",
          "weatherVaporPressure",
          "weatherWindSpeed",
          "weatherWindSpeedMax",
        ]),
      },
      {
        name: "stationId",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "resolution",
        type: "Path",
        schema: z.enum([
          "15min",
          "hourly",
          "daily",
          "weekly",
          "monthly",
          "yearly",
        ]),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "startDate",
        type: "Query",
        schema: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      },
      {
        name: "anchor",
        type: "Query",
        schema: z.literal("lastDataAt").optional(),
      },
    ],
    response: TimeSeriesResponse,
    errors: [
      {
        status: 404,
        description: `Station not found`,
        schema: z.null(),
      },
    ],
  },
  {
    method: "get",
    path: "/:type/:stationId/problems/:from/:to",
    alias: "count-aggregator.public.type.station.problems",
    requestFormat: "json",
    parameters: [
      {
        name: "type",
        type: "Path",
        schema: z.enum([
          "airQualityCO",
          "airQualityNO2",
          "airQualityO3",
          "airQualityPM10",
          "airQualityPM25",
          "airQualityStation",
          "bicycleCount",
          "bicycleSensorTotal",
          "peopleCount",
          "waterLevelSurface",
          "waterTemp",
          "weatherAirPressure",
          "weatherHumidity",
          "weatherLightingDistance",
          "weatherLightnings",
          "weatherRain",
          "weatherStation",
          "weatherSun",
          "weatherTemp",
          "weatherVaporPressure",
          "weatherWindSpeed",
          "weatherWindSpeedMax",
        ]),
      },
      {
        name: "stationId",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "from",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "to",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: DetectedDataProblem,
    errors: [
      {
        status: 404,
        description: `Station not found`,
        schema: z.null(),
      },
    ],
  },
  {
    method: "get",
    path: "/:type/:stationId/sums",
    alias: "count-aggregator.public.type.sums",
    requestFormat: "json",
    parameters: [
      {
        name: "type",
        type: "Path",
        schema: z.enum([
          "airQualityCO",
          "airQualityNO2",
          "airQualityO3",
          "airQualityPM10",
          "airQualityPM25",
          "airQualityStation",
          "bicycleCount",
          "bicycleSensorTotal",
          "peopleCount",
          "waterLevelSurface",
          "waterTemp",
          "weatherAirPressure",
          "weatherHumidity",
          "weatherLightingDistance",
          "weatherLightnings",
          "weatherRain",
          "weatherStation",
          "weatherSun",
          "weatherTemp",
          "weatherVaporPressure",
          "weatherWindSpeed",
          "weatherWindSpeedMax",
        ]),
      },
      {
        name: "stationId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: StationOverviewResponse,
    errors: [
      {
        status: 404,
        description: `Station not found`,
        schema: z.null(),
      },
    ],
  },
  {
    method: "get",
    path: "/:type/:stationId/values/:from/:to/:resolution",
    alias: "count-aggregator.public.type.station.values",
    requestFormat: "json",
    parameters: [
      {
        name: "type",
        type: "Path",
        schema: z.enum([
          "airQualityCO",
          "airQualityNO2",
          "airQualityO3",
          "airQualityPM10",
          "airQualityPM25",
          "airQualityStation",
          "bicycleCount",
          "bicycleSensorTotal",
          "peopleCount",
          "waterLevelSurface",
          "waterTemp",
          "weatherAirPressure",
          "weatherHumidity",
          "weatherLightingDistance",
          "weatherLightnings",
          "weatherRain",
          "weatherStation",
          "weatherSun",
          "weatherTemp",
          "weatherVaporPressure",
          "weatherWindSpeed",
          "weatherWindSpeedMax",
        ]),
      },
      {
        name: "stationId",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "from",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "to",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "resolution",
        type: "Path",
        schema: z.enum([
          "15min",
          "hourly",
          "daily",
          "weekly",
          "monthly",
          "yearly",
        ]),
      },
    ],
    response: TimeSeriesResponse,
    errors: [
      {
        status: 404,
        description: `Station not found`,
        schema: z.null(),
      },
    ],
  },
  {
    method: "get",
    path: "/:type/last-problems/:resolution",
    alias: "count-aggregator.public.type.last-problems",
    requestFormat: "json",
    parameters: [
      {
        name: "type",
        type: "Path",
        schema: z.enum([
          "airQualityCO",
          "airQualityNO2",
          "airQualityO3",
          "airQualityPM10",
          "airQualityPM25",
          "airQualityStation",
          "bicycleCount",
          "bicycleSensorTotal",
          "peopleCount",
          "waterLevelSurface",
          "waterTemp",
          "weatherAirPressure",
          "weatherHumidity",
          "weatherLightingDistance",
          "weatherLightnings",
          "weatherRain",
          "weatherStation",
          "weatherSun",
          "weatherTemp",
          "weatherVaporPressure",
          "weatherWindSpeed",
          "weatherWindSpeedMax",
        ]),
      },
      {
        name: "resolution",
        type: "Path",
        schema: z.enum([
          "15min",
          "hourly",
          "daily",
          "weekly",
          "monthly",
          "yearly",
        ]),
      },
      {
        name: "stationIds",
        type: "Query",
        schema: z.unknown(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "startDate",
        type: "Query",
        schema: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      },
    ],
    response: DetectedDataProblem,
  },
  {
    method: "get",
    path: "/:type/last-values/:resolution",
    alias: "count-aggregator.public.type.last-values",
    requestFormat: "json",
    parameters: [
      {
        name: "type",
        type: "Path",
        schema: z.enum([
          "airQualityCO",
          "airQualityNO2",
          "airQualityO3",
          "airQualityPM10",
          "airQualityPM25",
          "airQualityStation",
          "bicycleCount",
          "bicycleSensorTotal",
          "peopleCount",
          "waterLevelSurface",
          "waterTemp",
          "weatherAirPressure",
          "weatherHumidity",
          "weatherLightingDistance",
          "weatherLightnings",
          "weatherRain",
          "weatherStation",
          "weatherSun",
          "weatherTemp",
          "weatherVaporPressure",
          "weatherWindSpeed",
          "weatherWindSpeedMax",
        ]),
      },
      {
        name: "resolution",
        type: "Path",
        schema: z.enum([
          "15min",
          "hourly",
          "daily",
          "weekly",
          "monthly",
          "yearly",
        ]),
      },
      {
        name: "stationIds",
        type: "Query",
        schema: z.unknown(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "startDate",
        type: "Query",
        schema: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      },
      {
        name: "anchor",
        type: "Query",
        schema: z.literal("lastDataAt").optional(),
      },
      {
        name: "format",
        type: "Query",
        schema: z.enum(["json", "csv"]).optional(),
      },
    ],
    response: z.record(z.string(), TimeSeriesResponse),
  },
  {
    method: "get",
    path: "/:type/problems/:from/:to",
    alias: "count-aggregator.public.type.problems",
    requestFormat: "json",
    parameters: [
      {
        name: "type",
        type: "Path",
        schema: z.enum([
          "airQualityCO",
          "airQualityNO2",
          "airQualityO3",
          "airQualityPM10",
          "airQualityPM25",
          "airQualityStation",
          "bicycleCount",
          "bicycleSensorTotal",
          "peopleCount",
          "waterLevelSurface",
          "waterTemp",
          "weatherAirPressure",
          "weatherHumidity",
          "weatherLightingDistance",
          "weatherLightnings",
          "weatherRain",
          "weatherStation",
          "weatherSun",
          "weatherTemp",
          "weatherVaporPressure",
          "weatherWindSpeed",
          "weatherWindSpeedMax",
        ]),
      },
      {
        name: "from",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "to",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "stationIds",
        type: "Query",
        schema: z.unknown(),
      },
    ],
    response: DetectedDataProblem,
  },
  {
    method: "get",
    path: "/:type/stations",
    alias: "count-aggregator.public.type.stations",
    requestFormat: "json",
    parameters: [
      {
        name: "type",
        type: "Path",
        schema: z.enum([
          "airQualityCO",
          "airQualityNO2",
          "airQualityO3",
          "airQualityPM10",
          "airQualityPM25",
          "airQualityStation",
          "bicycleCount",
          "bicycleSensorTotal",
          "peopleCount",
          "waterLevelSurface",
          "waterTemp",
          "weatherAirPressure",
          "weatherHumidity",
          "weatherLightingDistance",
          "weatherLightnings",
          "weatherRain",
          "weatherStation",
          "weatherSun",
          "weatherTemp",
          "weatherVaporPressure",
          "weatherWindSpeed",
          "weatherWindSpeedMax",
        ]),
      },
      {
        name: "includeEmpty",
        type: "Query",
        schema: z.boolean().optional(),
      },
    ],
    response: StationListResponse,
  },
  {
    method: "get",
    path: "/:type/values/:from/:to/:resolution",
    alias: "count-aggregator.public.type.values",
    requestFormat: "json",
    parameters: [
      {
        name: "type",
        type: "Path",
        schema: z.enum([
          "airQualityCO",
          "airQualityNO2",
          "airQualityO3",
          "airQualityPM10",
          "airQualityPM25",
          "airQualityStation",
          "bicycleCount",
          "bicycleSensorTotal",
          "peopleCount",
          "waterLevelSurface",
          "waterTemp",
          "weatherAirPressure",
          "weatherHumidity",
          "weatherLightingDistance",
          "weatherLightnings",
          "weatherRain",
          "weatherStation",
          "weatherSun",
          "weatherTemp",
          "weatherVaporPressure",
          "weatherWindSpeed",
          "weatherWindSpeedMax",
        ]),
      },
      {
        name: "from",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "to",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "resolution",
        type: "Path",
        schema: z.enum([
          "15min",
          "hourly",
          "daily",
          "weekly",
          "monthly",
          "yearly",
        ]),
      },
      {
        name: "stationIds",
        type: "Query",
        schema: z.unknown(),
      },
      {
        name: "format",
        type: "Query",
        schema: z.enum(["json", "csv"]).optional(),
      },
    ],
    response: z.record(z.string(), TimeSeriesResponse),
  },
  {
    method: "get",
    path: "/park-and-ride/data",
    alias: "parkAndRidePublicApi.currentData",
    requestFormat: "json",
    response: z.record(z.string(), z.object({}).partial().strict().passthrough()),
  },
  {
    method: "get",
    path: "/park-and-ride/export",
    alias: "count-aggregator.public.",
    requestFormat: "json",
    response: GeoJsonFeatureCollection,
  },
  {
    method: "get",
    path: "/station-types",
    alias: "count-aggregator.public.station-types",
    requestFormat: "json",
    response: StationTypeListResponse,
  },
  {
    method: "get",
    path: "/stations.geojson",
    alias: "count-aggregator.public.stations.geojson",
    requestFormat: "json",
    parameters: [
      {
        name: "type",
        type: "Query",
        schema: z
          .enum([
            "airQualityCO",
            "airQualityNO2",
            "airQualityO3",
            "airQualityPM10",
            "airQualityPM25",
            "airQualityStation",
            "bicycleCount",
            "bicycleSensorTotal",
            "peopleCount",
            "waterLevelSurface",
            "waterTemp",
            "weatherAirPressure",
            "weatherHumidity",
            "weatherLightingDistance",
            "weatherLightnings",
            "weatherRain",
            "weatherStation",
            "weatherSun",
            "weatherTemp",
            "weatherVaporPressure",
            "weatherWindSpeed",
            "weatherWindSpeedMax",
          ])
          .optional(),
      },
      {
        name: "includeEmpty",
        type: "Query",
        schema: z.boolean().optional(),
      },
      {
        name: "flat",
        type: "Query",
        schema: z.boolean().optional(),
      },
      {
        name: "includeStats",
        type: "Query",
        schema: z.boolean().optional(),
      },
    ],
    response: StationGeoJsonFeatureCollection,
  },
] as const;
