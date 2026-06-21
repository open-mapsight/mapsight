import {type ReactElement, useMemo} from "react";

import type {BucketMetric} from "@mapsight/count-aggregator-api";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import {
	useAppConfig,
	useCountAggregatorI18n,
} from "../../context/count-aggregator-provider.js";
import {
	chartSeriesKey,
	normalizeSelectedMetrics,
} from "../../lib/bucket-metrics.js";
import {getColorForStationIndex} from "../../lib/colors.js";
import {formatChartAxisDate, getTooltipDateFormat} from "../../lib/dates.js";
import {
	formatMetricAxisValue,
	formatMetricValue,
	metricValueFormatFromAppConfig,
} from "../../lib/format-metric-value.js";
import {getMetricLabels} from "../../lib/i18n.js";
import {formatStationLabel} from "../../lib/stations.js";
import {getDocumentLocale, isDefined} from "../../lib/utils.js";
import type {
	AggregatedValuesData,
	ChartSeries,
	TimeSeriesChartProps,
} from "../../types";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltipContent,
} from "../ui/chart.js";

const DATA_LIMIT = 5_000;

function getFallbackResolutionMs(resolution: string): number {
	switch (resolution) {
		case "5min":
			return 5 * 60 * 1000;
		case "15min":
			return 15 * 60 * 1000;
		case "hourly":
			return 60 * 60 * 1000;
		case "daily":
			return 24 * 60 * 60 * 1000;
		case "weekly":
			return 7 * 24 * 60 * 60 * 1000;
		case "monthly":
			return 30 * 24 * 60 * 60 * 1000;
		case "yearly":
			return 365 * 24 * 60 * 60 * 1000;
		default:
			return 24 * 60 * 60 * 1000;
	}
}

function getColumnDomainPadding(
	chartData: Array<Record<string, number>>,
	resolution: string,
): number {
	const timestamps = chartData
		.map((entry) => entry.date)
		.filter((value): value is number => typeof value === "number")
		.sort((a, b) => a - b);

	const deltas = timestamps
		.slice(1)
		.map((timestamp, index) => timestamp - timestamps[index]!)
		.filter((delta) => delta > 0);

	const bucketMs =
		deltas.length === 0
			? getFallbackResolutionMs(resolution)
			: Math.min(...deltas);

	return bucketMs / 2;
}

function mergeSeriesData(
	series: readonly ChartSeries[],
): Array<Record<string, number>> {
	const byTimestamp = new Map<number, Record<string, number>>();

	for (const entry of series) {
		for (const {date, value} of entry.values) {
			const ts = date.getTime();
			const row = byTimestamp.get(ts) ?? {date: ts};
			row[entry.key] = value;
			byTimestamp.set(ts, row);
		}
	}

	return Array.from(byTimestamp.values()).sort(
		(a, b) => (a.date ?? 0) - (b.date ?? 0),
	);
}

function limitChartSeries(series: readonly ChartSeries[]): {
	tooMuchData: boolean;
	limitedSeries: ChartSeries[];
} {
	const perSeriesDataLimit = Math.max(
		1,
		Math.floor(DATA_LIMIT / Math.max(series.length, 1)),
	);

	let tooMuchData = false;
	const limitedSeries = series.map((entry) => {
		if (entry.values.length > perSeriesDataLimit) {
			tooMuchData = true;
			return {
				...entry,
				values: entry.values.slice(0, perSeriesDataLimit),
			};
		}

		return entry;
	});

	return {tooMuchData, limitedSeries};
}

function buildSeriesLabel(
	stationLabel: string,
	metric: BucketMetric,
	metricLabels: Record<BucketMetric, string>,
	showMetricInLabel: boolean,
): string {
	if (!showMetricInLabel) {
		return stationLabel;
	}

	return `${stationLabel} (${metricLabels[metric]})`;
}

export function TimeSeriesChart({
	type,
	appId,
	selectedStationIds,
	selectedMetrics,
	chartSeries,
	resolution,
	startDate,
	endDate,
	stationsById,
	className = "msca:h-[calc(100vh-400px)] msca:min-h-[300px] msca:max-h-[700px]",
	emptyMessage = "No measurements are available for the current selection.",
}: TimeSeriesChartProps): ReactElement {
	const appConfig = useAppConfig(appId);
	const {t} = useCountAggregatorI18n();
	const metricLabels = getMetricLabels(t);
	const valueFormat = metricValueFormatFromAppConfig(appConfig);
	const locale = getDocumentLocale();
	const showMetricInLabel =
		(selectedMetrics?.length ?? chartSeries?.length ?? 0) > 1 ||
		new Set(chartSeries?.map((entry) => entry.stationId)).size !==
			(chartSeries?.length ?? 0);

	const tooltipFormatter = useMemo(
		() => new Intl.DateTimeFormat(locale, getTooltipDateFormat(resolution)),
		[locale, resolution],
	);
	const formatAxisValue = useMemo(
		() => (value: number) =>
			formatMetricAxisValue(value, valueFormat, locale),
		[locale, valueFormat],
	);
	const formatTooltipValue = useMemo(
		() => (value: number) => formatMetricValue(value, valueFormat, locale),
		[locale, valueFormat],
	);

	const {chartConfig, chartData} = useMemo(() => {
		if (chartSeries === undefined) {
			return {chartConfig: {}, chartData: []};
		}

		const config: ChartConfig = {};
		for (const entry of chartSeries) {
			const station = stationsById?.get(entry.stationId);
			const stationLabel =
				station === undefined
					? entry.stationId.toString()
					: formatStationLabel(station);

			config[entry.key] = {
				label: buildSeriesLabel(
					stationLabel,
					entry.metric,
					metricLabels,
					showMetricInLabel,
				),
				color: getColorForStationIndex(
					selectedStationIds.indexOf(entry.stationId),
				),
			};
		}

		return {
			chartConfig: config,
			chartData: mergeSeriesData(chartSeries),
		};
	}, [
		chartSeries,
		metricLabels,
		selectedStationIds,
		showMetricInLabel,
		stationsById,
	]);

	const xDomain = useMemo(() => {
		const start = startDate.getTime();
		const end = endDate.getTime();
		if (type !== "column" || chartData.length === 0) {
			return [start, end] as [number, number];
		}

		const padding = getColumnDomainPadding(chartData, resolution);
		return [start - padding, end + padding] as [number, number];
	}, [chartData, endDate, resolution, startDate, type]);

	const commonAxisProps = {
		domain: xDomain,
		tickFormatter: (value: number) =>
			formatChartAxisDate(value, resolution),
		type: "number" as const,
		scale: "time" as const,
		dataKey: "date",
	};

	const seriesElements = (chartSeries ?? []).map((entry) => {
		const color = getColorForStationIndex(
			selectedStationIds.indexOf(entry.stationId),
		);

		if (type === "column") {
			return (
				<Bar
					key={entry.key}
					dataKey={entry.key}
					fill={color}
					isAnimationActive={false}
					maxBarSize={18}
				/>
			);
		}

		if (type === "area") {
			return (
				<Area
					key={entry.key}
					type="monotone"
					dataKey={entry.key}
					stroke={color}
					fill={color}
					fillOpacity={0.2}
					strokeWidth={2}
					isAnimationActive={false}
					dot={false}
				/>
			);
		}

		return (
			<Line
				key={entry.key}
				type="monotone"
				dataKey={entry.key}
				stroke={color}
				strokeWidth={2}
				isAnimationActive={false}
				dot={false}
			/>
		);
	});

	const ChartComponent =
		type === "column" ? BarChart : type === "area" ? AreaChart : LineChart;

	if (chartSeries !== undefined && chartData.length === 0) {
		return (
			<div className={`msca:relative msca:w-full ${className}`}>
				<div
					className="msca:absolute msca:inset-0 msca:flex msca:items-center msca:justify-center msca:rounded-md msca:border msca:border-dashed msca:border-[var(--msca-color-border)] msca:bg-[var(--msca-color-surface)] msca:p-6 msca:text-center msca:text-sm msca:text-[var(--msca-color-muted-foreground)]"
					role="status"
				>
					{emptyMessage}
				</div>
			</div>
		);
	}

	return (
		<div className={`msca:relative msca:w-full ${className}`}>
			<ChartContainer
				config={chartConfig}
				className="msca:absolute msca:inset-0 msca:h-full msca:w-full"
			>
				<ResponsiveContainer width="100%" height="100%">
					<ChartComponent
						data={chartData}
						margin={{top: 8, right: 12, left: 8, bottom: 0}}
						barCategoryGap="24%"
						barGap={1}
					>
						<CartesianGrid vertical={false} strokeDasharray="3 3" />
						<XAxis
							{...commonAxisProps}
							tickLine={false}
							axisLine={false}
							minTickGap={32}
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							allowDecimals={valueFormat.displayPrecision > 0}
							width={56}
							tickFormatter={formatAxisValue}
							label={
								valueFormat.unit
									? {
											value: valueFormat.unit,
											angle: -90,
											position: "insideLeft",
											style: {
												fill: "var(--msca-color-muted-foreground)",
												fontSize: 12,
											},
										}
									: undefined
							}
						/>
						<Tooltip
							content={
								<ChartTooltipContent
									labelFormatter={(label) =>
										tooltipFormatter.format(new Date(label))
									}
									valueFormatter={formatTooltipValue}
								/>
							}
						/>
						{seriesElements}
					</ChartComponent>
				</ResponsiveContainer>
			</ChartContainer>
		</div>
	);
}

export function prepareChartValues(
	selectedStationIds: readonly number[],
	data: AggregatedValuesData | undefined,
	selectedMetrics: readonly BucketMetric[] | undefined,
	fallbackMetric: BucketMetric,
): {
	tooMuchData: boolean;
	chartSeries: ChartSeries[] | undefined;
} {
	if (data === undefined || selectedStationIds.length === 0) {
		return {tooMuchData: false, chartSeries: undefined};
	}

	const metrics = normalizeSelectedMetrics(selectedMetrics, fallbackMetric);
	const stations = selectedStationIds
		.map((stationId) => data.stationsById.get(stationId))
		.filter(isDefined);

	if (stations.length === 0) {
		return {tooMuchData: false, chartSeries: undefined};
	}

	const chartSeries: ChartSeries[] = [];

	for (const station of stations) {
		for (const metric of metrics) {
			const values =
				station.valuesByMetric[metric] ??
				(metric === metrics[0] ? station.values : []);

			if (values.length === 0) {
				continue;
			}

			chartSeries.push({
				key: chartSeriesKey(station.stationId, metric),
				stationId: station.stationId,
				metric,
				values,
			});
		}
	}

	const {tooMuchData, limitedSeries} = limitChartSeries(chartSeries);

	return {tooMuchData, chartSeries: limitedSeries};
}

export {DATA_LIMIT};
