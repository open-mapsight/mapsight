import {type ReactElement, memo, useMemo} from "react";
import Flatpickr from "react-flatpickr";

import {German as flatpickrGermanLocale} from "flatpickr/dist/l10n/de";

import {useCountAggregatorPortal} from "../../context/count-aggregator-root.js";
import {
	dateToYmd,
	getFirstDayOfLastYear,
	getFirstDayOfMonth,
	getFirstDayOfYear,
	getLastDayOfLastYear,
	getLastDayOfMonth,
	getLastDayOfYear,
} from "../../lib/dates.js";
import {WizardButton} from "./wizard-button.js";

const DATEPICKER_OPTIONS = {
	locale: flatpickrGermanLocale,
	dateFormat: "Y-m-d",
	altInput: true,
	altFormat: "d.m.Y",
};

function DateInput({
	value,
	onChange,
	minDate,
	maxDate,
}: {
	value: Date;
	onChange: (date: Date) => void;
	minDate?: Date;
	maxDate?: Date;
}): ReactElement {
	const portalTarget = useCountAggregatorPortal();

	const flatpickrProps = useMemo(
		() => ({
			value,
			name: "date",
			className:
				"msca:border msca:border-[var(--msca-color-border)] msca:rounded msca:p-1 msca:w-28 msca:text-left msca:bg-[var(--msca-color-surface)]",
			options: {
				appendTo: portalTarget,
				minDate,
				maxDate,
				...DATEPICKER_OPTIONS,
			},
			onChange: (dates: Date[]) => {
				const nextDate = dates[0];
				if (nextDate !== undefined) {
					onChange(nextDate);
				}
			},
		}),
		[value, onChange, minDate, maxDate, portalTarget],
	);

	return <Flatpickr {...flatpickrProps} />;
}

export const TimeRangeSelection = memo(function TimeRangeSelection({
	startDate,
	setStartDate,
	endDate,
	setEndDate,
}: {
	startDate: Date;
	setStartDate: (date: Date) => void;
	endDate: Date;
	setEndDate: (date: Date) => void;
}): ReactElement {
	const presetButtons = useMemo(() => {
		const definitions = [
			{
				label: "Letztes Jahr",
				onClick: () => {
					setStartDate(getFirstDayOfLastYear());
					setEndDate(getLastDayOfLastYear());
				},
			},
			{
				label: "Letzter Monat",
				onClick: () => {
					let month = new Date().getMonth() - 1;
					let year = new Date().getFullYear();
					if (month === -1) {
						month = 11;
						year -= 1;
					}

					setStartDate(getFirstDayOfMonth(month + 1, year));
					setEndDate(getLastDayOfMonth(month + 1, year));
				},
			},
			{
				label: "Laufendes Jahr",
				onClick: () => {
					setStartDate(getFirstDayOfYear());
					setEndDate(getLastDayOfYear());
				},
			},
			{
				label: "Laufender Monat",
				onClick: () => {
					setStartDate(getFirstDayOfMonth());
					setEndDate(getLastDayOfMonth());
				},
			},
		];

		return definitions.map(({label, onClick}) => (
			<WizardButton key={label} type="button" onClick={onClick}>
				{label}
			</WizardButton>
		));
	}, [setStartDate, setEndDate]);

	return (
		<>
			<div className="msca:flex msca:flex-wrap msca:items-center msca:gap-x-4 msca:gap-y-2">
				<div className="msca:flex msca:items-center msca:gap-2">
					<span>Vom</span>
					<DateInput
						value={startDate}
						onChange={setStartDate}
						maxDate={endDate}
					/>
				</div>
				<div className="msca:flex msca:items-center msca:gap-2">
					<span>bis einschließlich</span>
					<DateInput
						value={endDate}
						onChange={setEndDate}
						minDate={startDate}
					/>
				</div>
			</div>

			<div className="msca:mt-3 msca:text-sm msca:text-gray-700">
				<span>Vorschläge:</span>
				<div className="msca:mt-2 msca:flex msca:flex-wrap msca:gap-2">
					{presetButtons}
				</div>
			</div>
		</>
	);
});

export const CalendarLinks = memo(function CalendarLinks({
	startDate,
	endDate,
	calendarBaseUrl,
}: {
	startDate: Date | null;
	endDate: Date | null;
	calendarBaseUrl: string;
}): ReactElement {
	const linkClassName =
		"msca:rounded msca:border msca:border-[var(--msca-color-border)] msca:bg-[var(--msca-color-surface)] msca:px-3 msca:py-1";

	return (
		<div className="msca:mt-5 msca:flex msca:select-none msca:flex-row msca:gap-5 msca:text-sm">
			{startDate !== null ? (
				<a
					href={`${calendarBaseUrl}/${dateToYmd(startDate)}`}
					className={linkClassName}
				>
					Zum Kalender (Startdatum)
				</a>
			) : null}
			{endDate !== null ? (
				<a
					href={`${calendarBaseUrl}/${dateToYmd(endDate)}`}
					className={linkClassName}
				>
					Zum Kalender (Enddatum)
				</a>
			) : null}
			{startDate === null && endDate === null ? (
				<a href={calendarBaseUrl} className={linkClassName}>
					Zum Kalender
				</a>
			) : null}
		</div>
	);
});
