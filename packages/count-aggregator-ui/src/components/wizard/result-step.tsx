import {Fragment, type ReactElement, useMemo} from "react";

import {buildCsvExportUrl} from "@mapsight/count-aggregator-api";
import type {BucketMetric} from "@mapsight/count-aggregator-api";

import {
	useAppConfig,
	useCountAggregatorI18n,
} from "../../context/count-aggregator-provider.js";
import {normalizeSelectedMetrics} from "../../lib/bucket-metrics.js";
import {getColorForStationIndex} from "../../lib/colors.js";
import {dateToYmd} from "../../lib/dates.js";
import {getResolutionLabels} from "../../lib/i18n.js";
import {isDefined} from "../../lib/utils.js";
import {
	type AggregatedValuesData,
	type ChartType,
	type DataResolution,
	type Station,
} from "../../types";
import {
	TimeSeriesChart,
	prepareChartValues,
} from "../charts/time-series-chart.js";
import {CsvDownloadLink} from "../export/csv-download-link.js";
import {ChartTypeSelect} from "./chart-type-select.js";
import {Section} from "./section.js";
import {StationLabel} from "./station-label.js";
import {WizardButton} from "./wizard-button.js";

export function ResultStep({
	appId,
	selectedStationIds,
	startDate,
	endDate,
	data,
	stationsById,
	chartType = "line",
	resolution = "daily",
	showExport = false,
	showChartTypeSelect = false,
	onChartTypeChange,
	onEditSelection,
	selectedMetrics = [],
}: {
	appId: string;
	selectedStationIds: readonly number[];
	startDate: Date;
	endDate: Date;
	data: AggregatedValuesData | undefined;
	stationsById: Map<number, Station> | undefined;
	chartType?: ChartType;
	resolution?: DataResolution;
	selectedMetrics?: readonly BucketMetric[];
	showExport?: boolean;
	showChartTypeSelect?: boolean;
	onChartTypeChange?: (chartType: ChartType) => void;
	onEditSelection?: () => void;
}): ReactElement {
	const appConfig = useAppConfig(appId);
	const {t} = useCountAggregatorI18n();
	const metrics = normalizeSelectedMetrics(
		selectedMetrics,
		appConfig.defaultMetric ?? "sum",
	);
	const errorMessages: string[] = [];

	if (selectedStationIds.length === 0) {
		errorMessages.push(t("result.noStations"));
	}

	if (startDate > endDate) {
		errorMessages.push(t("result.invalidDateRange"));
	}

	const isValid = errorMessages.length === 0;

	const stationTags = useMemo(() => {
		if (stationsById === undefined) {
			return [];
		}

		return selectedStationIds
			.map((stationId, index) => {
				const station = stationsById.get(stationId);
				const color = getColorForStationIndex(index);

				return (
					<li key={stationId}>
						<div className="msca:flex msca:grow msca:flex-row msca:items-center msca:gap-2 msca:px-2 msca:py-1 msca:text-left">
							<StationLabel station={station} color={color} />
						</div>
					</li>
				);
			})
			.filter(isDefined);
	}, [selectedStationIds, stationsById]);

	const {tooMuchData, chartSeries} = useMemo(
		() =>
			prepareChartValues(
				selectedStationIds,
				data,
				metrics,
				appConfig.defaultMetric ?? "sum",
			),
		[appConfig.defaultMetric, data, metrics, selectedStationIds],
	);

	const resolutionLabel =
		appConfig.resolutionLabels?.[resolution] ??
		getResolutionLabels(t)[resolution];

	const csvDownloadHref = useMemo(() => {
		if (!isValid) {
			return "";
		}

		return buildCsvExportUrl(appConfig.apiBaseUrl, {
			type: appConfig.stationType,
			from: dateToYmd(startDate),
			to: dateToYmd(endDate),
			resolution,
			stationIds: [...selectedStationIds],
			metrics,
		});
	}, [
		appConfig.apiBaseUrl,
		appConfig.stationType,
		endDate,
		isValid,
		metrics,
		resolution,
		selectedStationIds,
		startDate,
	]);

	return (
		<div>
			<Section title={t("result.chartSection")}>
				{!isValid ? (
					<p className="msca:bg-[var(--msca-color-danger-surface)] msca:p-2">
						{errorMessages.map((errorMessage) => (
							<Fragment key={errorMessage}>
								{errorMessage}
								<br />
							</Fragment>
						))}
						{onEditSelection !== undefined ? (
							<WizardButton
								type="button"
								className="msca:mt-2"
								onClick={onEditSelection}
							>
								{t("result.toSelection")}
							</WizardButton>
						) : null}
					</p>
				) : (
					<>
						{tooMuchData ? (
							<p className="msca:bg-[var(--msca-color-danger-surface)] msca:p-2">
								{t("result.tooMuchData")}
								{showExport
									? ` ${t("result.tooMuchDataWithExport")}`
									: null}
							</p>
						) : null}

						<TimeSeriesChart
							appId={appId}
							type={chartType}
							selectedStationIds={selectedStationIds}
							selectedMetrics={metrics}
							chartSeries={chartSeries}
							resolution={resolution}
							startDate={startDate}
							endDate={endDate}
							stationsById={stationsById}
							emptyMessage={t("chart.empty")}
						/>

						{showChartTypeSelect &&
						onChartTypeChange !== undefined ? (
							<ChartTypeSelect
								chartType={chartType}
								onChange={onChartTypeChange}
							/>
						) : null}
					</>
				)}
			</Section>

			{showExport ? (
				<Section title={t("result.downloadSection")}>
					<CsvDownloadLink
						href={csvDownloadHref}
						disabled={!isValid}
					/>
				</Section>
			) : null}

			{onEditSelection !== undefined ? (
				<Section title={t("result.selectionSection")}>
					{isValid ? (
						<>
							<p>
								<strong>{t("result.selectedStations")} </strong>
							</p>
							<ul className="msca:mb-2">{stationTags}</ul>
							<p>
								<strong>{t("result.interval")} </strong>
								{resolutionLabel}
								<br />
								<strong>{t("result.dateRange")} </strong>
								{`${dateToYmd(startDate)} - ${dateToYmd(endDate)}`}
							</p>
						</>
					) : null}
					<WizardButton
						type="button"
						className="msca:mt-2"
						onClick={onEditSelection}
					>
						{t("result.changeSelection")}
					</WizardButton>
				</Section>
			) : null}

			{!onEditSelection ? (
				<Section title={t("result.legendSection")}>
					{stationTags.length === 0 ? (
						<p className="msca:text-sm">
							{t("result.emptyLegend")}
						</p>
					) : (
						<ul>{stationTags}</ul>
					)}
				</Section>
			) : null}
		</div>
	);
}
