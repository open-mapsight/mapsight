import type {z} from "zod";

import type {schemas} from "./generated/client.js";

export type StationType = z.infer<typeof schemas.StationSummary>["type"];
export type Resolution = z.infer<
	typeof schemas.TimeSeriesResponse
>["resolution"];
export type LastValuesAnchor = "lastDataAt";
export type ResponseFormat = "json" | "csv";
export type IsoDate = string;
export type LocalDateTime = z.infer<typeof schemas.DataValuePoint>["datetime"];
export type DataValuePoint = z.infer<typeof schemas.DataValuePoint>;
export type StationMetric = z.infer<typeof schemas.StationMetric>;
export type TimeSeriesResponse = z.infer<typeof schemas.TimeSeriesResponse>;
export type TimeSeriesMapResponse = Record<string, TimeSeriesResponse>;
export type StationSummary = z.infer<typeof schemas.StationSummary>;
export type StationListResponse = z.infer<typeof schemas.StationListResponse>;
export type StationOverviewResponse = z.infer<
	typeof schemas.StationOverviewResponse
>;
export type StationTypeSummary = z.infer<typeof schemas.StationTypeSummary>;
export type BucketMetric = NonNullable<StationTypeSummary["defaultMetric"]>;
export type StationTypeListResponse = z.infer<
	typeof schemas.StationTypeListResponse
>;
export type DetectedDataProblem = z.infer<typeof schemas.DetectedDataProblem>;
export type ProblemsListResponse = DetectedDataProblem[];
