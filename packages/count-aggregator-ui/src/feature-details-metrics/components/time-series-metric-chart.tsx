import {type ReactElement, useMemo} from "react";

import {airQualityIndexBandColor} from "@mapsight/count-aggregator-api";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import {
	Y_AXIS_UNIT_LABEL_TOP_MARGIN,
	createYAxisUnitLabel,
} from "../../lib/chart-axis-label.js";
import {
	getCountAggregatorDictionary,
	resolveCountAggregatorLocale,
} from "../../lib/i18n.js";
import {getDocumentLocale} from "../../lib/utils.js";
import {
	formatMetricAxisTime,
	formatMetricAxisValueFromConfig,
	formatMetricTooltipTime,
	formatMetricTooltipValue,
} from "../lib/format-metric-values.js";
import type {MetricSeriesPoint, MetricWidgetConfig} from "../types.js";
import AirQualityIndexBadge from "./air-quality-index-badge.js";
import WindDirectionDisplay from "./wind-direction-display.js";

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

type TooltipPayloadItem = {
	value?: number;
	payload?: {
		timestamp?: number;
	};
};

function MetricChartTooltip({
	active,
	payload,
	config,
}: {
	active?: boolean;
	payload?: TooltipPayloadItem[];
	config: MetricWidgetConfig;
}): ReactElement | null {
	if (!active || payload === undefined || payload.length === 0) {
		return null;
	}

	const value = payload[0]?.value;
	const timestamp = payload[0]?.payload?.timestamp;

	if (value === undefined) {
		return null;
	}

	return (
		<div
			aria-live="polite"
			className="ms3-smart-city-metric__tooltip"
			role="tooltip"
		>
			{timestamp !== undefined ? (
				<div className="ms3-smart-city-metric__tooltip-time">
					{formatMetricTooltipTime(
						new Date(timestamp),
						config.resolution,
					)}
				</div>
			) : null}
			<div className="ms3-smart-city-metric__tooltip-value">
				{formatMetricTooltipValue(value, config)}
			</div>
		</div>
	);
}

export default function TimeSeriesMetricChart({points, config}: Props) {
	const chartData = useMemo(
		() =>
			points.map(({date, value}) => ({
				timestamp: date.getTime(),
				value,
			})),
		[points],
	);
	const timestamps = useMemo(
		() => chartData.map((point) => point.timestamp),
		[chartData],
	);
	const latestValue = points.at(-1)?.value;
	const locale = resolveCountAggregatorLocale(getDocumentLocale());

	if (chartData.length === 0 || latestValue === undefined) {
		const dictionary = getCountAggregatorDictionary(locale);

		return (
			<div className="ms3-smart-city-metric__empty">
				{dictionary["metrics.emptySeries"]}
			</div>
		);
	}

	if (config.variant === "windDirection") {
		return <WindDirectionDisplay degrees={latestValue} locale={locale} />;
	}

	const bandColor =
		config.variant === "airQualityIndex"
			? airQualityIndexBandColor(latestValue)
			: undefined;
	const strokeColor = bandColor ?? CHART_STROKE_COLOR;
	const fillColor = bandColor ?? CHART_FILL_COLOR;
	const ChartComponent = config.chartType === "line" ? LineChart : AreaChart;
	const showUnitAxis =
		Boolean(config.unit) && config.variant !== "airQualityIndex";

	return (
		<div className="ms3-smart-city-metric__chart-stack">
			{config.variant === "airQualityIndex" ? (
				<AirQualityIndexBadge value={latestValue} locale={locale} />
			) : null}
			<div className="ms3-smart-city-metric__chart">
				<ResponsiveContainer width="100%" height={METRIC_CHART_HEIGHT}>
					<ChartComponent
						data={chartData}
						margin={{
							top: showUnitAxis
								? Y_AXIS_UNIT_LABEL_TOP_MARGIN
								: 6,
							right: 6,
							left: 0,
							bottom: 0,
						}}
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
								formatMetricAxisTime(
									new Date(value),
									config.resolution,
									timestamps,
								)
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
							domain={
								config.variant === "airQualityIndex"
									? [1, 5]
									: ["auto", "auto"]
							}
							tickFormatter={(value: number) =>
								config.variant === "airQualityIndex"
									? String(Math.round(value))
									: formatMetricAxisValueFromConfig(
											value,
											config,
										)
							}
							label={
								showUnitAxis && config.unit
									? createYAxisUnitLabel(config.unit, {
											fill: CHART_TICK_COLOR,
											fontSize: CHART_TICK_FONT_SIZE,
										})
									: undefined
							}
						/>
						<Tooltip
							content={<MetricChartTooltip config={config} />}
							cursor={{
								stroke: CHART_TICK_COLOR,
								strokeDasharray: "3 3",
								strokeWidth: 1,
							}}
							isAnimationActive={false}
							wrapperStyle={{outline: "none", zIndex: 2}}
						/>
						{config.chartType === "line" ? (
							<Line
								type="monotone"
								dataKey="value"
								stroke={strokeColor}
								strokeWidth={1.5}
								dot={false}
								isAnimationActive={false}
							/>
						) : (
							<Area
								type="monotone"
								dataKey="value"
								stroke={strokeColor}
								fill={fillColor}
								fillOpacity={0.35}
								strokeWidth={1.5}
								dot={false}
								isAnimationActive={false}
							/>
						)}
					</ChartComponent>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
