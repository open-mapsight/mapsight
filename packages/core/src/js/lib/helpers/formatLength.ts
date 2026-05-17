export const defaultMeterFormat = new Intl.NumberFormat(undefined, {
	style: "unit",
	maximumFractionDigits: 2,
	unit: "meter",
});

export const defaultKilometerFormat = new Intl.NumberFormat(undefined, {
	style: "unit",
	maximumFractionDigits: 2,
	unit: "kilometer",
});

export type FormatOptions = {
	/** meterFormat */
	meterFormat?: Intl.NumberFormat;
	/** kilometerFormat */
	kilometerFormat?: Intl.NumberFormat;
};

/**
 * Format length
 *
 * @param length Length in meters
 * @param options options
 * @returns The formatted length string
 */
export function formatLength(
	length: number,
	{
		meterFormat = defaultMeterFormat,
		kilometerFormat = defaultKilometerFormat,
	}: FormatOptions = {},
) {
	const isKilometer = length > 1000;
	const format = isKilometer ? kilometerFormat : meterFormat;
	const amount = isKilometer ? length / 1000 : length;
	return format.format(amount);
}
