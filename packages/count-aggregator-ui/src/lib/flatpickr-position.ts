const CALENDAR_GAP_PX = 2;

export type FlatpickrPositionInstance = {
	calendarContainer: HTMLElement;
	_positionElement?: HTMLElement;
	altInput?: HTMLInputElement;
	_input: HTMLElement;
};

/**
 * Flatpickr writes document coordinates onto `position: absolute` calendars.
 * When `appendTo` is the count-aggregator portal (inside a positioned panel),
 * those values are offset by the panel's viewport origin — the end-date
 * calendar then sits well to the right of its input.
 *
 * Reposition with `position: fixed` and the input's viewport box, matching
 * how react-select menus use `menuPosition="fixed"` in the same portal.
 */
export function alignFlatpickrCalendar(
	calendar: HTMLElement,
	input: HTMLElement,
): void {
	const inputRect = input.getBoundingClientRect();
	const calendarWidth = calendar.offsetWidth;
	const calendarHeight = calendar.offsetHeight;
	const spaceBelow = window.innerHeight - inputRect.bottom;
	const showOnTop =
		spaceBelow < calendarHeight && inputRect.top > calendarHeight;

	let left = inputRect.left;
	if (left + calendarWidth > window.innerWidth) {
		left = Math.max(0, inputRect.right - calendarWidth);
	}

	calendar.style.position = "fixed";
	calendar.style.left = `${left}px`;
	calendar.style.right = "auto";
	calendar.style.top = `${
		showOnTop
			? inputRect.top - calendarHeight - CALENDAR_GAP_PX
			: inputRect.bottom + CALENDAR_GAP_PX
	}px`;
}

export function alignFlatpickrInstance(
	instance: FlatpickrPositionInstance,
): void {
	const input =
		instance._positionElement ?? instance.altInput ?? instance._input;

	alignFlatpickrCalendar(instance.calendarContainer, input);
}
