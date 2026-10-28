import type {FormEvent, MouseEvent} from "react";
import {memo, useCallback, useEffect, useRef} from "react";
import {useDispatch, useSelector} from "react-redux";

// TODO: Make optional to reduce bundle size
import flatpickr from "flatpickr";
// TODO: Make optional to reduce bundle size
// TODO: Support other languages
import {German as flatpickrGermanLocale} from "flatpickr/dist/l10n/de";
import type {Instance} from "flatpickr/dist/types/instance";

import {mergeFilterOptions} from "@mapsight/core/lib/filter/actions";

// TODO: Replace with generic tracking solution that does not rely on simplejs to be used globally
import {trackEvent} from "@mapsight/lib-js/misc/piwik";

import {TIME_FILTER} from "../config/constants/controllers";
import {translate} from "../helpers/i18n";

type TimeFilterRootState = {
	[TIME_FILTER]?: {fromDate?: string | null; toDate?: string | null};
};

const ID_FROM = "ms3-timefilter__from";
const ID_TO = "ms3-timefilter__to";

const DATEPICKER_OPTIONS = {
	// TODO: Support other languages
	locale: flatpickrGermanLocale,
	dateFormat: "d.m.Y", // TODO: i18n
};

const parseDate = (str: string) => {
	const parts = str.replace(/\s/, "").match(/(\d+)/g);
	try {
		const date = new Date(
			Number(parts![2]),
			Number(parts![1]) - 1,
			Number(parts![0]),
		);

		return !isNaN(date.getTime()) ? date : null;
	} catch (_e) {
		return null;
	}
};

// FIXME i18n
const formatDate = (date: string | null | undefined) => {
	if (!date) {
		return "";
	}

	// State crosses the JSON boundary as ISO strings. Use the same UTC date
	// on the server and client, irrespective of the host process timezone.
	const value = new Date(date);
	if (isNaN(value.getTime())) return "";
	const day = value.getUTCDate();
	const monthIndex = value.getUTCMonth();
	const year = value.getUTCFullYear();

	return day + "." + String(monthIndex + 1).padStart(2, "0") + "." + year;
};

function fromDateSelector(state: TimeFilterRootState) {
	return state[TIME_FILTER] && state[TIME_FILTER].fromDate;
}

function toDateSelector(state: TimeFilterRootState) {
	return state[TIME_FILTER] && state[TIME_FILTER].toDate;
}

function TimeFilter() {
	// FIXME: stop using hardcoded ids
	// TODO: use react input fields

	const dispatch = useDispatch();

	const fromDate = useSelector(fromDateSelector);
	const toDate = useSelector(toDateSelector);

	const fromInputRef = useRef<HTMLInputElement & {_flatpickr?: Instance}>(
		null,
	);
	const toInputRef = useRef<HTMLInputElement & {_flatpickr?: Instance}>(null);

	useEffect(() => {
		// The change handlers run after both datepickers have been initialized.

		const from = flatpickr(fromInputRef.current!, {
			...DATEPICKER_OPTIONS,
			onChange: function onChange(selectedDates) {
				if (selectedDates.length) {
					to.set("minDate", selectedDates[0]!);
					to.redraw();
				}
			},
		});

		const to = flatpickr(toInputRef.current!, {
			...DATEPICKER_OPTIONS,
			onChange: function onChange(selectedDates) {
				if (selectedDates.length) {
					from.set("maxDate", selectedDates[0]!);
					from.redraw();
				}
			},
		});
	}, []);

	const onSubmit = useCallback(
		(e: FormEvent<HTMLFormElement>) => {
			e.preventDefault();

			// get values
			const myFromDate = parseDate(fromInputRef.current!.value);
			const myToDate = parseDate(toInputRef.current!.value);

			dispatch(
				mergeFilterOptions(TIME_FILTER, {
					fromDate: myFromDate && myFromDate.toISOString(),
					toDate: myToDate && myToDate.toISOString(),
				}),
			);

			trackEvent("Mapsight", "Filtered");
		},
		[dispatch],
	);

	const onReset = useCallback(
		(_e: MouseEvent<HTMLButtonElement>) => {
			[fromInputRef.current, toInputRef.current].forEach((element) => {
				element!._flatpickr!.clear();
				element!._flatpickr!.set("minDate", undefined);
				element!._flatpickr!.set("maxDate", undefined);
			});

			dispatch(
				mergeFilterOptions(TIME_FILTER, {
					fromDate: null,
					toDate: null,
				}),
			);

			trackEvent("Mapsight", "FilterCleared");
		},
		[dispatch],
	);

	return (
		<form onSubmit={onSubmit} className="ms3-timefilter">
			<h2>{translate("ui.time-filter.span")}</h2>
			<p>
				<label htmlFor={ID_FROM}>
					<span className="ms3-visuallyhidden">
						{translate("from")}
					</span>
					<input
						id={ID_FROM}
						name={ID_FROM}
						defaultValue={formatDate(fromDate)}
						ref={fromInputRef}
					/>
				</label>

				<label htmlFor={ID_TO}>
					-
					<input
						id={ID_TO}
						name={ID_TO}
						defaultValue={formatDate(toDate)}
						ref={toInputRef}
					/>
				</label>

				<button
					type="button"
					className="ms3-filter-button ms3-filter-button--secondary"
					onClick={onReset}
				>
					{translate("reset")}
				</button>

				<button type="submit" className="ms3-filter-button">
					{translate("show")}
				</button>
			</p>
		</form>
	);
}

export default memo(TimeFilter);
