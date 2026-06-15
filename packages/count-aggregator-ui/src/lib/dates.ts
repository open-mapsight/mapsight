import type {DataResolution} from "../types";

export function dateToYmd(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

export function ymdToDate(input: string): Date {
	const [y, m, d] = input.split("-").map((part) => parseInt(part, 10));
	return new Date(y!, m! - 1, d);
}

export function getFirstDayOfMonth(
	month = new Date().getMonth() + 1,
	year = new Date().getFullYear(),
): Date {
	return new Date(year, month - 1);
}

export function getLastDayOfMonth(
	month = new Date().getMonth() + 1,
	year = new Date().getFullYear(),
): Date {
	const date = new Date(year, month - 1 + 1, 0, 12, 0, 0, 0);
	return new Date(year, month - 1, date.getDate());
}

export function getToday(): Date {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getDaysAgo(days: number): Date {
	const today = getToday();
	return new Date(
		today.getFullYear(),
		today.getMonth(),
		today.getDate() - days,
	);
}

export function getFirstDayOfYear(): Date {
	const currYear = new Date().getFullYear();
	return new Date(currYear, 0);
}

export function getLastDayOfYear(): Date {
	const currYear = new Date().getFullYear();
	return new Date(currYear, 11, 31);
}

export function getFirstDayOfLastYear(): Date {
	const currYear = new Date().getFullYear();
	return new Date(currYear - 1, 0);
}

export function getLastDayOfLastYear(): Date {
	const currYear = new Date().getFullYear();
	return new Date(currYear - 1, 11, 31);
}

export function getTooltipDateFormat(
	resolution: DataResolution,
): Intl.DateTimeFormatOptions {
	switch (resolution) {
		case "hourly":
			return {
				weekday: "long",
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
				hour: "numeric",
			};
		case "weekly":
			return {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
			};
		case "monthly":
			return {month: "long", year: "numeric"};
		case "yearly":
			return {year: "numeric"};
		default:
			return {
				weekday: "long",
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
			};
	}
}

export function formatChartAxisDate(
	timestamp: number,
	resolution: DataResolution,
): string {
	const date = new Date(timestamp);

	switch (resolution) {
		case "monthly":
			return date.toLocaleDateString(undefined, {
				month: "short",
				year: "2-digit",
			});
		case "yearly":
			return date.getFullYear().toString();
		case "hourly":
			return date.toLocaleTimeString(undefined, {
				hour: "2-digit",
				minute: "2-digit",
			});
		default:
			return date.toLocaleDateString(undefined, {
				day: "numeric",
				month: "short",
			});
	}
}
