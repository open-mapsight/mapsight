/**
 * Converts a string to a valid CSS name by trimming it, converting it to lower case, and
 * replacing everything but numbers and latin characters with a dash. A dash will be prepended
 * if the string starts with a number!
 *
 * @param str string to be converted
 * @returns converted string
 */
export default function escapeCssName(str: string): string {
	if (str === undefined || str === null) {
		return str;
	}

	return String(str)
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "-")
		.replace(/^([0-9])/, "-$1");
}
