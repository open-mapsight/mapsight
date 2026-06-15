import {type ReactElement, useMemo} from "react";

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

import {getColorForStationIndex} from "../../lib/colors.js";
import {formatChartAxisDate, getTooltipDateFormat} from "../../lib/dates.js";
import {formatStationLabel} from "../../lib/stations.js";
import {getDocumentLocale, isDefined} from "../../lib/utils.js";
import type {
	AggregatedValuesData,
	StationValue,
	TimeSeriesChartProps,
} from "../../types";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltipContent,
} from "../ui/chart.js";

const DATA_LIMIT = 5_000;

function stationDataKey(stationId: number): string {
	return `station_${stationId}`;
}

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
	selectedStationIds: readonly number[],
	valuesByStationId: Map<number, StationValue[]>,
): Array<Record<string, number>> {
	const byTimestamp = new Map<number, Record<string, number>>();

	for (const stationId of selectedStationIds) {
		const values = valuesByStationId.get(stationId) ?? [];

		for (const {date, value} of values) {
			const ts = date.getTime();
			const row = byTimestamp.get(ts) ?? {date: ts};
			row[stationDataKey(stationId)] = value;
			byTimestamp.set(ts, row);
		}
	}

	return Array.from(byTimestamp.values()).sort(
		(a, b) => (a.date ?? 0) - (b.date ?? 0),
	);
}

function limitValuesByStation(
	selectedStationIds: readonly number[],
	valuesByStationId: Map<number, StationValue[]>,
): {
	tooMuchData: boolean;
	limitedValues: Map<number, StationValue[]>;
} {
	const perStationDataLimit = Math.max(
		1,
		Math.floor(DATA_LIMIT / selectedStationIds.length),
	);

	let tooMuchData = false;
	const limitedValues = new Map<number, StationValue[]>();

	for (const stationId of selectedStationIds) {
		const values = valuesByStationId.get(stationId) ?? [];

		if (values.length > perStationDataLimit) {
			tooMuchData = true;
			limitedValues.set(stationId, values.slice(0, perStationDataLimit));
		} else {
			limitedValues.set(stationId, values);
		}
	}

	return {tooMuchData, limitedValues};
}

export function TimeSeriesChart({
	type,
	selectedStationIds,
	valuesByStationId,
	resolution,
	startDate,
	endDate,
	stationsById,
	className = "msca:h-[calc(100vh-400px)] msca:min-h-[300px] msca:max-h-[700px]",
	emptyMessage = "No measurements are available for the current selection.",
}: TimeSeriesChartProps): ReactElement {
	const tooltipFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat(
				getDocumentLocale(),
				getTooltipDateFormat(resolution),
			),
		[resolution],
	);
	const numberFormatter = useMemo(
		() =>
			new Intl.NumberFormat(getDocumentLocale(), {
				maximumFractionDigits: 2,
			}),
		[],
	);

	const {chartConfig, chartData} = useMemo(() => {
		if (valuesByStationId === undefined) {
			return {chartConfig: {}, chartData: []};
		}

		const config: ChartConfig = {};
		for (const [index, stationId] of selectedStationIds.entries()) {
			const station = stationsById?.get(stationId);
			config[stationDataKey(stationId)] = {
				label:
					station === undefined
						? stationId.toString()
						: formatStationLabel(station),
				color: getColorForStationIndex(index),
			};
		}

		const data = mergeSeriesData(selectedStationIds, valuesByStationId);

		return {chartConfig: config, chartData: data};
	}, [selectedStationIds, stationsById, valuesByStationId]);

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

	const seriesElements = selectedStationIds.map((stationId, index) => {
		const color = getColorForStationIndex(index);
		const key = stationDataKey(stationId);

		if (type === "column") {
			return (
				<Bar
					key={key}
					dataKey={key}
					fill={color}
					isAnimationActive={false}
					maxBarSize={18}
				/>
			);
		}

		if (type === "area") {
			return (
				<Area
					key={key}
					type="monotone"
					dataKey={key}
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
				key={key}
				type="monotone"
				dataKey={key}
				stroke={color}
				strokeWidth={2}
				isAnimationActive={false}
				dot={false}
			/>
		);
	});

	const ChartComponent =
		type === "column" ? BarChart : type === "area" ? AreaChart : LineChart;

	if (valuesByStationId !== undefined && chartData.length === 0) {
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
							allowDecimals={false}
							width={56}
							tickFormatter={(value: number) =>
								numberFormatter.format(value)
							}
						/>
						<Tooltip
							content={
								<ChartTooltipContent
									labelFormatter={(label) =>
										tooltipFormatter.format(new Date(label))
									}
									valueFormatter={(value) =>
										numberFormatter.format(value)
									}
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
): {
	tooMuchData: boolean;
	valuesByStationId: Map<number, StationValue[]> | undefined;
} {
	if (data === undefined || selectedStationIds.length === 0) {
		return {tooMuchData: false, valuesByStationId: undefined};
	}

	const stations = selectedStationIds
		.map((stationId) => data.stationsById.get(stationId))
		.filter(isDefined);

	if (stations.length === 0) {
		return {tooMuchData: false, valuesByStationId: undefined};
	}

	const valuesByStationId = new Map(
		stations.map((station) => [station.stationId, station.values]),
	);

	const {tooMuchData, limitedValues} = limitValuesByStation(
		selectedStationIds,
		valuesByStationId,
	);

	return {tooMuchData, valuesByStationId: limitedValues};
}

export {DATA_LIMIT};
