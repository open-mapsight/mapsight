import {Fragment, type ReactElement, useMemo} from "react";

import {buildCsvExportUrl} from "@mapsight/count-aggregator-api";

import {useAppConfig} from "../../context/count-aggregator-provider.js";
import {getColorForStationIndex} from "../../lib/colors.js";
import {dateToYmd} from "../../lib/dates.js";
import {isDefined} from "../../lib/utils.js";
import {
	type AggregatedValuesData,
	type ChartType,
	DEFAULT_RESOLUTION_LABELS,
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
}: {
	appId: string;
	selectedStationIds: readonly number[];
	startDate: Date;
	endDate: Date;
	data: AggregatedValuesData | undefined;
	stationsById: Map<number, Station> | undefined;
	chartType?: ChartType;
	resolution?: DataResolution;
	showExport?: boolean;
	showChartTypeSelect?: boolean;
	onChartTypeChange?: (chartType: ChartType) => void;
	onEditSelection?: () => void;
}): ReactElement {
	const appConfig = useAppConfig(appId);
	const errorMessages: string[] = [];

	if (selectedStationIds.length === 0) {
		errorMessages.push(
			"Keine Messstellen ausgewählt. Bitte wählen Sie mindestens eine Messstelle.",
		);
	}

	if (startDate > endDate) {
		errorMessages.push("Das Enddatum liegt vor dem Startdatum!");
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

	const {tooMuchData, valuesByStationId} = useMemo(
		() => prepareChartValues(selectedStationIds, data),
		[data, selectedStationIds],
	);

	const resolutionLabel =
		appConfig.resolutionLabels?.[resolution] ??
		DEFAULT_RESOLUTION_LABELS[resolution];

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
		});
	}, [
		appConfig.apiBaseUrl,
		appConfig.stationType,
		endDate,
		isValid,
		resolution,
		selectedStationIds,
		startDate,
	]);

	return (
		<div>
			{onEditSelection !== undefined ? (
				<Section title="Auswahl">
					{isValid ? (
						<>
							<p>
								<strong>Gewählte Messstellen: </strong>
							</p>
							<ul className="msca:mb-2">{stationTags}</ul>
							<p>
								<strong>Gewählter Intervall: </strong>
								{resolutionLabel}
								<br />
								<strong>Gewählter Zeitraum: </strong>
								{`${dateToYmd(startDate)} bis ${dateToYmd(endDate)}`}
							</p>
						</>
					) : null}
					<WizardButton
						type="button"
						className="msca:mt-2"
						onClick={onEditSelection}
					>
						Auswahl ändern
					</WizardButton>
				</Section>
			) : null}

			<Section title="Diagramm">
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
								Zurück zur Auswahl
							</WizardButton>
						) : null}
					</p>
				) : (
					<>
						{tooMuchData ? (
							<p className="msca:bg-[var(--msca-color-danger-surface)] msca:p-2">
								Hinweis: Die Diagrammdarstellung wurde auf 5.000
								Datenpunkte (über die Stationen verteilt)
								begrenzt.
								{showExport
									? " Bitte nutzen Sie den Download-Link für den vollständigen Datensatz."
									: null}
							</p>
						) : null}

						<TimeSeriesChart
							type={chartType}
							selectedStationIds={selectedStationIds}
							valuesByStationId={valuesByStationId}
							resolution={resolution}
							startDate={startDate}
							endDate={endDate}
							stationsById={stationsById}
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

			{!onEditSelection ? (
				<Section title="Legende">
					{stationTags.length === 0 ? (
						<p className="msca:text-sm">
							Keine Messstellen gewählt
						</p>
					) : (
						<ul>{stationTags}</ul>
					)}
				</Section>
			) : null}

			{showExport ? (
				<Section title="Download">
					<CsvDownloadLink
						href={csvDownloadHref}
						disabled={!isValid}
					/>
				</Section>
			) : null}
		</div>
	);
}
