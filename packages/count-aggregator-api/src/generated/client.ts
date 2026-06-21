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
   * External origin id from the upstream data source.
   */
  originId: string;
  name: string | null;
  /**
   * Station type identifier. See `GET /station-types` for currently available types.
   *
   * @enum airQualityCO, airQualityNO2, airQualityO3, airQualityPM10, airQualityPM25, airQualityStation, bicycleSensorTotal, peopleCount, waterLevelSurface, waterTemp, weatherAirPressure, weatherHumidity, weatherLightingDistance, weatherLightnings, weatherRain, weatherStation, weatherSun, weatherTemp, weatherVaporPressure, weatherWindSpeed, weatherWindSpeedMax
   */
  type:
    | "airQualityCO"
    | "airQualityNO2"
    | "airQualityO3"
    | "airQualityPM10"
    | "airQualityPM25"
    | "airQualityStation"
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
   * Station type identifier. See `GET /station-types` for currently available types.
   *
   * @enum airQualityCO, airQualityNO2, airQualityO3, airQualityPM10, airQualityPM25, airQualityStation, bicycleSensorTotal, peopleCount, waterLevelSurface, waterTemp, weatherAirPressure, weatherHumidity, weatherLightingDistance, weatherLightnings, weatherRain, weatherStation, weatherSun, weatherTemp, weatherVaporPressure, weatherWindSpeed, weatherWindSpeedMax
   */
  countAggregatorType:
    | "airQualityCO"
    | "airQualityNO2"
    | "airQualityO3"
    | "airQualityPM10"
    | "airQualityPM25"
    | "airQualityStation"
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
   * Stable numeric count aggregator station id for linking to the time-series/data view. Present when this feature represents one data station.
   */
  countAggregatorStationId: number;
  countAggregatorLinks?: /**
   * Structured data-view links for grouped multi-metric features. Present when a map feature represents multiple metric/time-series stations.
   */
  | Array<{
        /**
         * Stable count aggregator metric type identifier.
         *
         * @enum airQualityCO, airQualityNO2, airQualityO3, airQualityPM10, airQualityPM25, airQualityStation, bicycleSensorTotal, peopleCount, waterLevelSurface, waterTemp, weatherAirPressure, weatherHumidity, weatherLightingDistance, weatherLightnings, weatherRain, weatherStation, weatherSun, weatherTemp, weatherVaporPressure, weatherWindSpeed, weatherWindSpeedMax
         */
        type:
          | "airQualityCO"
          | "airQualityNO2"
          | "airQualityO3"
          | "airQualityPM10"
          | "airQualityPM25"
          | "airQualityStation"
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
         * Stable numeric count aggregator station id for this metric.
         */
        stationId: number;
      }>
    | undefined;
  /**
   * Grouped filter tags for the frontend, keyed by user-facing group name (e.g. `Wetter`, `Mobilität`, `Gewässer`, `Luftqualität`, `Sonstige`).
   */
  tagGroups: Partial<{
    Wetter: {
      /**
       * When false, any listed tag matches (OR). When true, all listed tags must match (AND).
       */
      andJunction: boolean;
      tags: Array<string>;
    };
    Luftqualität: {
      /**
       * When false, any listed tag matches (OR). When true, all listed tags must match (AND).
       */
      andJunction: boolean;
      tags: Array<string>;
    };
    Mobilität: {
      /**
       * When false, any listed tag matches (OR). When true, all listed tags must match (AND).
       */
      andJunction: boolean;
      tags: Array<string>;
    };
    Gewässer: {
      /**
       * When false, any listed tag matches (OR). When true, all listed tags must match (AND).
       */
      andJunction: boolean;
      tags: Array<string>;
    };
    Sonstige: {
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
   * Font Awesome icon identifier from the upstream data source (e.g. fa-water). Omitted when no icon is configured.
   */
  mapsightIconId: string;
  legacyDashboardId?: string | undefined;
  description?: /**
   * Station description from the upstream data source. Omitted when not configured.
   */
  string | undefined;
  unit?: /**
   * Physical unit of the metric values as reported by the data source (e.g. `°C`, `µg/m³`). Omitted for dimensionless counters and container stations.
   */
  string | undefined;
  childStations?: /**
   * Metric child stations grouped under this container (grouped mode only).
   */
  | Array<{
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
         * Stable child metric type identifier for linking to data views.
         */
        countAggregatorType: string;
        /**
         * Stable numeric child station id for linking to the time-series/data view.
         */
        countAggregatorStationId: number;
        /**
         * German human-readable child type label.
         */
        typeLabel: string;
        unit?: /**
         * Physical unit of the metric values as reported by the data source (e.g. `°C`, `µg/m³`). Omitted for dimensionless counters and container stations.
         */
        string | undefined;
        mapsightIconId?: /**
         * Font Awesome icon identifier from the upstream data source (e.g. fa-water). Omitted when no icon is configured.
         */
        string | undefined;
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
      }>
    | undefined;
  parentId?: /**
   * Platform station id of the container station (flat mode only).
   */
  string | undefined;
  parentType?: /**
   * Type of the container station (flat mode only).
   */
  string | undefined;
  parentTypeLabel?: /**
   * German human-readable label of the container station (flat mode only).
   */
  string | undefined;
  stats?: /**
   * Precomputed counter stats. Only present when `includeStats=true`. Omitted when not yet cached.
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
   * @enum airQualityCO, airQualityNO2, airQualityO3, airQualityPM10, airQualityPM25, airQualityStation, bicycleSensorTotal, peopleCount, waterLevelSurface, waterTemp, weatherAirPressure, weatherHumidity, weatherLightingDistance, weatherLightnings, weatherRain, weatherStation, weatherSun, weatherTemp, weatherVaporPressure, weatherWindSpeed, weatherWindSpeedMax
   */
  type:
    | "airQualityCO"
    | "airQualityNO2"
    | "airQualityO3"
    | "airQualityPM10"
    | "airQualityPM25"
    | "airQualityStation"
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
  defaultMetric?:
    | /**
     * Optional per-station override of the type default metric.
     *
     * @enum sum, mean, min, max, last
     */
    ("sum" | "mean" | "min" | "max" | "last")
    | undefined;
  supportedResolutions?: /**
   * Optional per-station override when available resolutions differ within a type.
   */
  | Array<
        /**
         * @enum 5min, 15min, hourly, daily, weekly, monthly, yearly
         */
        "5min" | "15min" | "hourly" | "daily" | "weekly" | "monthly" | "yearly"
      >
    | undefined;
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
  sum?: (number | null) | undefined;
  mean?: (number | null) | undefined;
  min?: (number | null) | undefined;
  max?: (number | null) | undefined;
  last?: (number | null) | undefined;
  value?:
    | /**
     * Backward-compatible alias for the station type default metric when present in the bucket.
     */
    /**
     * Backward-compatible alias for the station type default metric when present in the bucket.
     */
    (| number
        /**
         * Backward-compatible alias for the station type default metric when present in the bucket.
         */
        | null
      )
    | undefined;
};
type StationTypeListResponse = {
  data: Array<StationTypeSummary>;
};
type StationTypeSummary = {
  /**
   * Station type identifier. See `GET /station-types` for currently available types.
   *
   * @enum airQualityCO, airQualityNO2, airQualityO3, airQualityPM10, airQualityPM25, airQualityStation, bicycleSensorTotal, peopleCount, waterLevelSurface, waterTemp, weatherAirPressure, weatherHumidity, weatherLightingDistance, weatherLightnings, weatherRain, weatherStation, weatherSun, weatherTemp, weatherVaporPressure, weatherWindSpeed, weatherWindSpeedMax
   */
  type:
    | "airQualityCO"
    | "airQualityNO2"
    | "airQualityO3"
    | "airQualityPM10"
    | "airQualityPM25"
    | "airQualityStation"
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
  category: StationTypeCategory;
  /**
   * Default bucket statistic returned when the `metrics` query parameter is omitted.
   *
   * @enum sum, mean, min, max, last
   */
  defaultMetric: "sum" | "mean" | "min" | "max" | "last";
  /**
   * Resolutions available for this station type. Drives wizard and comparison resolution pickers.
   */
  supportedResolutions: Array<
    /**
     * @enum 5min, 15min, hourly, daily, weekly, monthly, yearly
     */
    "5min" | "15min" | "hourly" | "daily" | "weekly" | "monthly" | "yearly"
  >;
  metrics: Array<StationMetric>;
};
type StationTypeCategory = {
  id: string;
  label: string;
};
type StationMetric = {
  id: string;
  label: string;
  unit: string | null;
  displayPrecision: number;
  /**
   * @enum sum, mean, min, max, last
   */
  defaultMetric: "sum" | "mean" | "min" | "max" | "last";
  aggregation: Array<
    /**
     * @enum sum, mean, min, max, last
     */
    "sum" | "mean" | "min" | "max" | "last"
  >;
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
   * Time bucket used to aggregate count values. Allowed values: `5min`, `15min`, `hourly`, `daily`, `weekly`, `monthly`, `yearly`.
   *
   * @enum 5min, 15min, hourly, daily, weekly, monthly, yearly
   */
  resolution:
    | "5min"
    | "15min"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly";
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
      countAggregatorType: z.enum([
        "airQualityCO",
        "airQualityNO2",
        "airQualityO3",
        "airQualityPM10",
        "airQualityPM25",
        "airQualityStation",
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
      countAggregatorStationId: z.number().int(),
      countAggregatorLinks: z
        .array(
          z
            .object({
              type: z.enum([
                "airQualityCO",
                "airQualityNO2",
                "airQualityO3",
                "airQualityPM10",
                "airQualityPM25",
                "airQualityStation",
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
              stationId: z.number().int(),
            })
            .strict()
            .passthrough()
        )
        .optional(),
      tagGroups: z
        .object({
          Wetter: z
            .object({ andJunction: z.boolean(), tags: z.array(z.string()) })
            .strict()
            .passthrough(),
          Luftqualität: z
            .object({ andJunction: z.boolean(), tags: z.array(z.string()) })
            .strict()
            .passthrough(),
          Mobilität: z
            .object({ andJunction: z.boolean(), tags: z.array(z.string()) })
            .strict()
            .passthrough(),
          Gewässer: z
            .object({ andJunction: z.boolean(), tags: z.array(z.string()) })
            .strict()
            .passthrough(),
          Sonstige: z
            .object({ andJunction: z.boolean(), tags: z.array(z.string()) })
            .strict()
            .passthrough(),
        })
        .partial()
        .strict()
        .passthrough(),
      lastDataAt: z.string(),
      mapsightIconId: z.string(),
      legacyDashboardId: z.string().optional(),
      description: z.string().optional(),
      unit: z.string().optional(),
      childStations: z
        .array(
          z
            .object({
              id: z.string(),
              originId: z.string(),
              name: z.union([z.string(), z.null()]).optional(),
              type: z.string(),
              countAggregatorType: z.string(),
              countAggregatorStationId: z.number().int(),
              typeLabel: z.string(),
              unit: z.string().optional(),
              mapsightIconId: z.string().optional(),
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
        )
        .optional(),
      parentId: z.string().optional(),
      parentType: z.string().optional(),
      parentTypeLabel: z.string().optional(),
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
const StationTypeCategory: z.ZodType<StationTypeCategory> = z
  .object({ id: z.string(), label: z.string() })
  .strict()
  .passthrough();
const StationMetric: z.ZodType<StationMetric> = z
  .object({
    id: z.string(),
    label: z.string(),
    unit: z.union([z.string(), z.null()]),
    displayPrecision: z.number().int(),
    defaultMetric: z.enum(["sum", "mean", "min", "max", "last"]),
    aggregation: z.array(z.enum(["sum", "mean", "min", "max", "last"])),
  })
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
    category: StationTypeCategory,
    defaultMetric: z.enum(["sum", "mean", "min", "max", "last"]),
    supportedResolutions: z.array(
      z.enum([
        "5min",
        "15min",
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly",
      ])
    ),
    metrics: z.array(StationMetric),
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
    defaultMetric: z.enum(["sum", "mean", "min", "max", "last"]).optional(),
    supportedResolutions: z
      .array(
        z.enum([
          "5min",
          "15min",
          "hourly",
          "daily",
          "weekly",
          "monthly",
          "yearly",
        ])
      )
      .optional(),
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
    sum: z.union([z.number(), z.null()]).optional(),
    mean: z.union([z.number(), z.null()]).optional(),
    min: z.union([z.number(), z.null()]).optional(),
    max: z.union([z.number(), z.null()]).optional(),
    last: z.union([z.number(), z.null()]).optional(),
    value: z.union([z.number(), z.null()]).optional(),
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
      "5min",
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
  StationTypeCategory,
  StationMetric,
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
          "5min",
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
          "5min",
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
      {
        name: "metrics",
        type: "Query",
        schema: z.string().optional(),
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
    path: "/:type/:stationId/values",
    alias: "count-aggregator.public.type.station.values.query",
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
        type: "Query",
        schema: z.string().regex(/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}:\d{2})?$/),
      },
      {
        name: "to",
        type: "Query",
        schema: z.string().regex(/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}:\d{2})?$/),
      },
      {
        name: "resolution",
        type: "Query",
        schema: z.unknown(),
      },
      {
        name: "metrics",
        type: "Query",
        schema: z.string().optional(),
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
          "5min",
          "15min",
          "hourly",
          "daily",
          "weekly",
          "monthly",
          "yearly",
        ]),
      },
      {
        name: "metrics",
        type: "Query",
        schema: z.string().optional(),
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
          "5min",
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
          "5min",
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
      {
        name: "metrics",
        type: "Query",
        schema: z.string().optional(),
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
    path: "/:type/values",
    alias: "count-aggregator.public.type.values.query",
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
        name: "stationIds",
        type: "Query",
        schema: z.unknown(),
      },
      {
        name: "from",
        type: "Query",
        schema: z.string().regex(/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}:\d{2})?$/),
      },
      {
        name: "to",
        type: "Query",
        schema: z.string().regex(/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}:\d{2})?$/),
      },
      {
        name: "resolution",
        type: "Query",
        schema: z.unknown(),
      },
      {
        name: "format",
        type: "Query",
        schema: z.enum(["json", "csv"]).optional(),
      },
      {
        name: "metrics",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.record(z.string(), TimeSeriesResponse),
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
          "5min",
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
      {
        name: "metrics",
        type: "Query",
        schema: z.string().optional(),
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
    alias: "count-aggregator.public.park-and-ride.export",
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
