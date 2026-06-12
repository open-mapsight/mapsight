import {type FormEvent, type ReactElement, useCallback, useState} from "react";

import {useAggregatedValues, useStations} from "../../api/hooks.js";
import {applyPresetDateRanges} from "../../config/platform.js";
import {useAppConfig} from "../../context/count-aggregator-provider.js";
import {getFirstDayOfMonth, getLastDayOfMonth} from "../../lib/dates.js";
import {isFeatureEnabled} from "../../lib/features.js";
import type {ChartType, DataResolution, PresetData, Station} from "../../types";
import {Events} from "../wizard/events.js";
import {PresetSelect} from "../wizard/preset-select.js";
import {ResolutionSelect} from "../wizard/resolution-select.js";
import {ResultStep} from "../wizard/result-step.js";
import {Section} from "../wizard/section.js";
import {StationSelect} from "../wizard/station-select.js";
import {SteppedWizardShell} from "../wizard/stepped-wizard-shell.js";
import {
	CalendarLinks,
	TimeRangeSelection,
} from "../wizard/time-range-selection.js";
import {WizardButton, WizardPrimaryButton} from "../wizard/wizard-button.js";

function getStationSectionTitle(stationType: string): string {
	return stationType === "bicycleCount" ? "Radzählstationen" : "Messstellen";
}

function getStationPlaceholder(stationType: string): string {
	return stationType === "bicycleCount"
		? "Radzählstationen auswählen …"
		: "Messstellen auswählen …";
}

function SelectionPanel({
	stationType,
	stationsById,
	selectedStationIds,
	onSelectedStationIdsChange,
	startDate,
	endDate,
	onStartDateChange,
	onEndDateChange,
	resolution,
	onResolutionChange,
	onPresetChange,
	showPresets,
	showResolutionSelect,
	showBulkActions,
	resolutions,
	resolutionLabels,
}: {
	stationType: string;
	stationsById: Map<number, Station> | undefined;
	selectedStationIds: readonly number[];
	onSelectedStationIdsChange: (ids: readonly number[]) => void;
	startDate: Date;
	endDate: Date;
	onStartDateChange: (date: Date) => void;
	onEndDateChange: (date: Date) => void;
	resolution: DataResolution;
	onResolutionChange: (resolution: DataResolution) => void;
	onPresetChange: (preset: PresetData | null) => void;
	showPresets: boolean;
	showResolutionSelect: boolean;
	showBulkActions?: boolean;
	resolutions: readonly DataResolution[];
	resolutionLabels?: Partial<Record<DataResolution, string>>;
}): ReactElement {
	const handleSelectAll = useCallback(() => {
		if (stationsById === undefined) {
			return;
		}

		onSelectedStationIdsChange(Array.from(stationsById.keys()));
	}, [onSelectedStationIdsChange, stationsById]);

	const handleResetStations = useCallback(() => {
		onSelectedStationIdsChange([]);
	}, [onSelectedStationIdsChange]);

	return (
		<>
			<Section title={getStationSectionTitle(stationType)}>
				<div className="msca:flex msca:flex-row msca:gap-4">
					<StationSelect
						className="msca:grow"
						stationsById={stationsById}
						stationIds={selectedStationIds}
						onChange={onSelectedStationIdsChange}
						isMulti={true}
						showDescriptionInSelection={false}
						placeholder={getStationPlaceholder(stationType)}
						styleOverrides={{
							control: {
								width: "100%",
								maxWidth: "none",
							},
						}}
						closeMenuOnSelect={false}
					/>
					{showPresets ? (
						<PresetSelect allowAdd={false} onSet={onPresetChange} />
					) : null}
				</div>
				{showBulkActions ? (
					<div className="msca:mt-2 msca:flex msca:flex-wrap msca:gap-2">
						<WizardButton type="button" onClick={handleSelectAll}>
							Alle hinzufügen
						</WizardButton>
						<WizardButton
							type="button"
							onClick={handleResetStations}
						>
							Zurücksetzen
						</WizardButton>
					</div>
				) : null}
			</Section>

			{showResolutionSelect ? (
				<ResolutionSelect
					resolution={resolution}
					resolutions={resolutions}
					resolutionLabels={resolutionLabels}
					onChange={onResolutionChange}
				/>
			) : null}

			<Section title="Zeitraum">
				<TimeRangeSelection
					startDate={startDate}
					setStartDate={onStartDateChange}
					endDate={endDate}
					setEndDate={onEndDateChange}
				/>
			</Section>
		</>
	);
}

export function CountAggregatorWizard({appId}: {appId: string}): ReactElement {
	const appConfig = useAppConfig(appId);
	const isStepped = appConfig.uiVariant === "stepped";
	const showPresets = isFeatureEnabled(appConfig, "presets");
	const showEvents = isFeatureEnabled(appConfig, "events");
	const showResolutionSelect = isFeatureEnabled(
		appConfig,
		"resolutionSelect",
	);
	const showExport = isFeatureEnabled(appConfig, "export");
	const showChartTypeSelect = isFeatureEnabled(appConfig, "chartTypeSelect");

	const resolutions = appConfig.resolutions ?? (["daily"] as const);

	const [step, setStep] = useState<0 | 1>(0);
	const [selectedStationIds, setSelectedStationIds] = useState<
		readonly number[]
	>([]);
	const [startDate, setStartDate] = useState(getFirstDayOfMonth);
	const [endDate, setEndDate] = useState(getLastDayOfMonth);
	const [resolution, setResolution] = useState<DataResolution>(
		appConfig.defaultResolution ?? "daily",
	);
	const [chartType, setChartType] = useState<ChartType>(
		appConfig.defaultChartType ?? "line",
	);

	const stationsById = useStations(appId);
	const valuesEnabled = !isStepped || step === 1;
	const data = useAggregatedValues(
		appId,
		{
			stationIds: selectedStationIds,
			startDate,
			endDate,
			resolution,
		},
		{enabled: valuesEnabled},
	);

	const handlePresetChange = useCallback((preset: PresetData | null) => {
		if (preset === null) {
			return;
		}

		setSelectedStationIds([
			preset.mainStationId,
			...preset.additionalStationRefs.map(({id}) => id),
		]);

		const {startDate: presetStartDate, endDate: presetEndDate} =
			applyPresetDateRanges(preset.additionalDateRanges);

		if (presetStartDate) {
			setStartDate(presetStartDate);
		}

		if (presetEndDate) {
			setEndDate(presetEndDate);
		}
	}, []);

	const handleSteppedSubmit = useCallback((event: FormEvent) => {
		event.preventDefault();
		setStep(1);
	}, []);

	const handleEditSelection = useCallback(() => {
		setStep(0);
	}, []);

	const resultStep = (
		<ResultStep
			appId={appId}
			selectedStationIds={selectedStationIds}
			data={data}
			startDate={startDate}
			endDate={endDate}
			stationsById={stationsById}
			chartType={chartType}
			resolution={resolution}
			showExport={showExport}
			showChartTypeSelect={showChartTypeSelect}
			onChartTypeChange={setChartType}
			onEditSelection={isStepped ? handleEditSelection : undefined}
		/>
	);

	const eventsSection = showEvents ? (
		<Section title="Verkehrsereignisse im gewählten Zeitraum">
			<Events appId={appId} startDate={startDate} endDate={endDate} />

			<CalendarLinks
				startDate={startDate}
				endDate={endDate}
				calendarBaseUrl="/msp/traffic-calendar/calendar"
			/>
		</Section>
	) : null;

	if (isStepped) {
		return (
			<SteppedWizardShell
				step={step}
				onStepChange={setStep}
				onSubmit={handleSteppedSubmit}
			>
				{step === 0 ? (
					<>
						<SelectionPanel
							stationType={appConfig.stationType}
							stationsById={stationsById}
							selectedStationIds={selectedStationIds}
							onSelectedStationIdsChange={setSelectedStationIds}
							startDate={startDate}
							endDate={endDate}
							onStartDateChange={setStartDate}
							onEndDateChange={setEndDate}
							resolution={resolution}
							onResolutionChange={setResolution}
							onPresetChange={handlePresetChange}
							showPresets={showPresets}
							showResolutionSelect={showResolutionSelect}
							showBulkActions={true}
							resolutions={resolutions}
							resolutionLabels={appConfig.resolutionLabels}
						/>
						<div className="msca:flex msca:justify-end">
							<WizardPrimaryButton>Weiter</WizardPrimaryButton>
						</div>
					</>
				) : (
					<>
						{resultStep}
						{eventsSection}
					</>
				)}
			</SteppedWizardShell>
		);
	}

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
			}}
		>
			<SelectionPanel
				stationType={appConfig.stationType}
				stationsById={stationsById}
				selectedStationIds={selectedStationIds}
				onSelectedStationIdsChange={setSelectedStationIds}
				startDate={startDate}
				endDate={endDate}
				onStartDateChange={setStartDate}
				onEndDateChange={setEndDate}
				resolution={resolution}
				onResolutionChange={setResolution}
				onPresetChange={handlePresetChange}
				showPresets={showPresets}
				showResolutionSelect={showResolutionSelect}
				resolutions={resolutions}
				resolutionLabels={appConfig.resolutionLabels}
			/>

			<div className="msca:my-3 msca:border-t msca:border-[var(--msca-color-border)]" />

			{resultStep}
			{eventsSection}
		</form>
	);
}

export function TrafficDataWizard(): ReactElement {
	return <CountAggregatorWizard appId="traffic-data" />;
}

export function SmartCityWizard(): ReactElement {
	return <CountAggregatorWizard appId="smart-city" />;
}

export function WheelCounterWizard(): ReactElement {
	return <CountAggregatorWizard appId="wheel-counter" />;
}
