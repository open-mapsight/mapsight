import {type ReactElement, useMemo} from "react";

import {buildLastValuesCsvExportUrl} from "@mapsight/count-aggregator-api";
import type {BucketMetric} from "@mapsight/count-aggregator-api";

import {useLastValues} from "../../api/hooks.js";
import {
	useAppConfig,
	useCountAggregatorI18n,
} from "../../context/count-aggregator-provider.js";
import type {ChartType, DataResolution, Station} from "../../types";
import {CsvDownloadLink} from "../export/csv-download-link.js";
import {Section} from "../wizard/section.js";
import {TimeSeriesChart, prepareChartValues} from "./time-series-chart.js";

export interface OverviewChartConfig {
	title: string;
	resolution: DataResolution;
	limit: number;
	chartType: ChartType;
	metrics?: readonly BucketMetric[];
}

function OverviewChart({
	appId,
	stationIds,
	config,
	stationsById,
	variant,
	chartClassName,
	hideTitle,
}: {
	appId: string;
	stationIds: readonly number[];
	config: OverviewChartConfig;
	stationsById: Map<number, Station> | undefined;
	variant: "card" | "plain";
	chartClassName?: string;
	hideTitle: boolean;
}): ReactElement {
	const appConfig = useAppConfig(appId);
	const {t} = useCountAggregatorI18n();
	const selectedMetrics = useMemo(
		() =>
			config.metrics ??
			appConfig.defaultChartMetrics ?? [appConfig.defaultMetric ?? "sum"],
		[
			appConfig.defaultChartMetrics,
			appConfig.defaultMetric,
			config.metrics,
		],
	);
	const data = useLastValues(appId, {
		stationIds,
		resolution: config.resolution,
		limit: config.limit,
		metrics: selectedMetrics,
	});

	const {chartSeries} = useMemo(
		() =>
			prepareChartValues(
				stationIds,
				data,
				selectedMetrics,
				appConfig.defaultMetric ?? "sum",
			),
		[appConfig.defaultMetric, data, selectedMetrics, stationIds],
	);

	const {startDate, endDate} = useMemo(() => {
		let min = Number.POSITIVE_INFINITY;
		let max = Number.NEGATIVE_INFINITY;

		if (chartSeries !== undefined) {
			for (const series of chartSeries) {
				for (const {date} of series.values) {
					const ts = date.getTime();
					if (ts < min) min = ts;
					if (ts > max) max = ts;
				}
			}
		}

		if (min === Number.POSITIVE_INFINITY) {
			const now = new Date();
			return {startDate: now, endDate: now};
		}

		return {startDate: new Date(min), endDate: new Date(max)};
	}, [chartSeries]);

	const csvHref = useMemo(
		() =>
			buildLastValuesCsvExportUrl(appConfig.apiBaseUrl, {
				type: appConfig.stationType,
				resolution: config.resolution,
				stationIds: [...stationIds],
				limit: config.limit,
				metrics: selectedMetrics,
			}),
		[
			appConfig.apiBaseUrl,
			appConfig.stationType,
			config.limit,
			config.resolution,
			selectedMetrics,
			stationIds,
		],
	);

	const articleClassName =
		variant === "card"
			? "msca:min-w-0 msca:max-w-full msca:border msca:border-(--msca-color-border) msca:bg-(--msca-color-surface)"
			: "msca:min-w-0 msca:max-w-full msca:bg-transparent";
	const bodyClassName =
		variant === "card" ? "msca:min-w-0 msca:p-6" : "msca:min-w-0";

	return (
		<article className={articleClassName}>
			<div className={bodyClassName}>
				<Section
					title={config.title}
					titleClassName={hideTitle ? "msca:sr-only" : undefined}
				>
					<TimeSeriesChart
						appId={appId}
						type={config.chartType}
						selectedStationIds={stationIds}
						selectedMetrics={selectedMetrics}
						chartSeries={chartSeries}
						resolution={config.resolution}
						startDate={startDate}
						endDate={endDate}
						stationsById={stationsById}
						className={chartClassName}
						emptyMessage={t("chart.empty")}
					/>
				</Section>

				<Section title={t("result.downloadSection")}>
					<CsvDownloadLink href={csvHref} />
				</Section>
			</div>
		</article>
	);
}

export function OverviewChartPanel({
	appId,
	stationIds,
	charts,
	stationsById,
	variant = "card",
	chartClassName,
	hideTitles = false,
}: {
	appId: string;
	stationIds: readonly number[];
	charts: readonly OverviewChartConfig[];
	stationsById: Map<number, Station> | undefined;
	variant?: "card" | "plain";
	chartClassName?: string;
	hideTitles?: boolean;
}): ReactElement {
	return (
		<div className="msca:min-w-0 msca:max-w-full msca:space-y-6">
			{charts.map((chart) => (
				<OverviewChart
					key={`${chart.resolution}-${chart.limit}-${chart.chartType}`}
					appId={appId}
					stationIds={stationIds}
					config={chart}
					stationsById={stationsById}
					variant={variant}
					chartClassName={chartClassName}
					hideTitle={hideTitles}
				/>
			))}
		</div>
	);
}
