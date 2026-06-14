import {type ReactElement, useMemo} from "react";

import {buildLastValuesCsvExportUrl} from "@mapsight/count-aggregator-api";

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
}

function OverviewChart({
	appId,
	stationIds,
	config,
	stationsById,
}: {
	appId: string;
	stationIds: readonly number[];
	config: OverviewChartConfig;
	stationsById: Map<number, Station> | undefined;
}): ReactElement {
	const appConfig = useAppConfig(appId);
	const {t} = useCountAggregatorI18n();
	const data = useLastValues(appId, {
		stationIds,
		resolution: config.resolution,
		limit: config.limit,
	});

	const {valuesByStationId} = useMemo(
		() => prepareChartValues(stationIds, data),
		[data, stationIds],
	);

	const {startDate, endDate} = useMemo(() => {
		let min = Number.POSITIVE_INFINITY;
		let max = Number.NEGATIVE_INFINITY;

		if (valuesByStationId !== undefined) {
			for (const values of valuesByStationId.values()) {
				for (const {date} of values) {
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
	}, [valuesByStationId]);

	const csvHref = useMemo(
		() =>
			buildLastValuesCsvExportUrl(appConfig.apiBaseUrl, {
				type: appConfig.stationType,
				resolution: config.resolution,
				stationIds: [...stationIds],
				limit: config.limit,
			}),
		[
			appConfig.apiBaseUrl,
			appConfig.stationType,
			config.limit,
			config.resolution,
			stationIds,
		],
	);

	return (
		<article className="msca:border msca:border-[var(--msca-color-border)] msca:bg-[var(--msca-color-surface)]">
			<div className="msca:p-6">
				<Section title={config.title}>
					<TimeSeriesChart
						type={config.chartType}
						selectedStationIds={stationIds}
						valuesByStationId={valuesByStationId}
						resolution={config.resolution}
						startDate={startDate}
						endDate={endDate}
						stationsById={stationsById}
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
}: {
	appId: string;
	stationIds: readonly number[];
	charts: readonly OverviewChartConfig[];
	stationsById: Map<number, Station> | undefined;
}): ReactElement {
	return (
		<div className="msca:space-y-6">
			{charts.map((chart) => (
				<OverviewChart
					key={`${chart.resolution}-${chart.limit}-${chart.chartType}`}
					appId={appId}
					stationIds={stationIds}
					config={chart}
					stationsById={stationsById}
				/>
			))}
		</div>
	);
}
