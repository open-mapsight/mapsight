import {mergeFilterOptions} from "@mapsight/core/lib/filter/actions";

// TODO: Replace with generic tracking solution that does not rely on simplejs to be used globally
import {trackEvent} from "@mapsight/lib-js/misc/piwik";

// TODO: Make optional to reduce bundle size
import flatpickr from "flatpickr";

// TODO: Make optional to reduce bundle size
// TODO: Support other languages
import {German as flatpickrGermanLocale} from "flatpickr/dist/l10n/de";
import { memo, useCallback, useEffect, useRef} from "react";
import {useDispatch, useSelector} from "react-redux";
import {TIME_FILTER} from "../config/constants/controllers";

import {translate} from "../helpers/i18n";

const ID_FROM = "ms3-timefilter__from";
const ID_TO = "ms3-timefilter__to";

const DATEPICKER_OPTIONS = {
	// TODO: Support other languages
	locale: flatpickrGermanLocale,
	dateFormat: "d.m.Y", // TODO: i18n
};

const leftPad = (str, padding) => (padding + str).substring(str.length);

const parseDate = (str) => {
	const parts = str.replace(/\s/, "").match(/(\d+)/g);
	try {
		const date = new Date(parts[2], parts[1] - 1, parts[0]);

		return !isNaN(date.getTime()) ? date : null;
	} catch (_e) {
		return null;
	}
};

// FIXME i18n
const formatDate = (date) => {
	if (!date) {
		return "";
	}

	const day = date.getDate();
	const monthIndex = date.getMonth();
	const year = date.getFullYear();

	return day + "." + leftPad(monthIndex + 1, "00") + "." + year;
};

function fromDateSelector(state) {
	return state[TIME_FILTER] && state[TIME_FILTER].fromDate;
}

function toDateSelector(state) {
	return state[TIME_FILTER] && state[TIME_FILTER].toDate;
}

function TimeFilter() {
	// FIXME: stop using hardcoded ids
	// TODO: use react input fields

	const dispatch = useDispatch();

	const fromDate = useSelector(fromDateSelector);
	const toDate = useSelector(toDateSelector);

	const fromInputRef = useRef();
	const toInputRef = useRef();

	useEffect(() => {
		// we need to use let because to and from reference each other

		let to;

		const from = flatpickr(fromInputRef.current, {
			...DATEPICKER_OPTIONS,
			onChange: function onChange(selectedDates) {
				if (selectedDates.length) {
					to.set("minDate", selectedDates[0]);
					to.redraw();
				}
			},
		});

		to = flatpickr(toInputRef.current, {
			...DATEPICKER_OPTIONS,
			onChange: function onChange(selectedDates) {
				if (selectedDates.length) {
					from.set("maxDate", selectedDates[0]);
					from.redraw();
				}
			},
		});
	}, []);

	const onSubmit = useCallback(
		/**
		 * @param {MouseEvent<HTMLButtonElement>} e event
		 */
		(e) => {
			e.preventDefault();

			// get values
			const myFromDate = parseDate(fromInputRef.current.value);
			const myToDate = parseDate(toInputRef.current.value);

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
		/**
		 * @param {MouseEvent<HTMLButtonElement>} _e event
		 */
		(_e) => {
			[fromInputRef.current, toInputRef.current].forEach((element) => {
				element._flatpickr.clear();
				element._flatpickr.set("minDate", undefined);
				element._flatpickr.set("maxDate", undefined);
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
