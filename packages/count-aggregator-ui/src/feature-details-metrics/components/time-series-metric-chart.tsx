import {useMemo} from "react";

import {
	Area,
	AreaChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts";

import {
	getCountAggregatorDictionary,
	resolveCountAggregatorLocale,
} from "../../lib/i18n.js";
import {getDocumentLocale} from "../../lib/utils.js";
import {formatMetricAxisTime} from "../lib/format-metric-values.js";
import type {MetricSeriesPoint, MetricWidgetConfig} from "../types.js";

const METRIC_CHART_HEIGHT = 140;
const CHART_TICK_FONT_SIZE = 10;
const CHART_TICK_COLOR = "#6b7280";
const CHART_GRID_COLOR = "#e5e7eb";
const CHART_STROKE_COLOR = "#4b5563";
const CHART_FILL_COLOR = "#d1d5db";

const chartTickStyle = {
	fontSize: CHART_TICK_FONT_SIZE,
	fill: CHART_TICK_COLOR,
};

type Props = {
	points: MetricSeriesPoint[];
	config: MetricWidgetConfig;
};

export default function TimeSeriesMetricChart({points, config}: Props) {
	const chartData = useMemo(
		() =>
			points.map(({date, value}) => ({
				timestamp: date.getTime(),
				value,
			})),
		[points],
	);

	if (chartData.length === 0) {
		const dictionary = getCountAggregatorDictionary(
			resolveCountAggregatorLocale(getDocumentLocale()),
		);

		return (
			<div className="ms3-smart-city-metric__empty">
				{dictionary["metrics.emptySeries"]}
			</div>
		);
	}

	const ChartComponent = config.chartType === "line" ? LineChart : AreaChart;

	return (
		<div className="ms3-smart-city-metric__chart">
			<ResponsiveContainer width="100%" height={METRIC_CHART_HEIGHT}>
				<ChartComponent
					data={chartData}
					margin={{top: 6, right: 6, left: 0, bottom: 0}}
				>
					<CartesianGrid
						stroke={CHART_GRID_COLOR}
						strokeDasharray="3 3"
						vertical={false}
					/>
					<XAxis
						dataKey="timestamp"
						type="number"
						scale="time"
						domain={["dataMin", "dataMax"]}
						tickFormatter={(value: number) =>
							formatMetricAxisTime(new Date(value))
						}
						tick={chartTickStyle}
						tickLine={false}
						axisLine={false}
						minTickGap={20}
						height={24}
					/>
					<YAxis
						tick={chartTickStyle}
						tickLine={false}
						axisLine={false}
						width={34}
						tickFormatter={(value: number) =>
							new Intl.NumberFormat(getDocumentLocale("de-DE"), {
								maximumFractionDigits: config.decimals ?? 1,
							}).format(value)
						}
					/>
					{config.chartType === "line" ? (
						<Line
							type="monotone"
							dataKey="value"
							stroke={CHART_STROKE_COLOR}
							strokeWidth={1.5}
							dot={false}
							isAnimationActive={false}
						/>
					) : (
						<Area
							type="monotone"
							dataKey="value"
							stroke={CHART_STROKE_COLOR}
							fill={CHART_FILL_COLOR}
							fillOpacity={0.35}
							strokeWidth={1.5}
							dot={false}
							isAnimationActive={false}
						/>
					)}
				</ChartComponent>
			</ResponsiveContainer>
		</div>
	);
}
