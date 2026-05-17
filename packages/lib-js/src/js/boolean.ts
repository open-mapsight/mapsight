/**
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Falsy
 */
export function isTruthy<T>(
	value: T | null | undefined | false | typeof NaN | 0n | "",
): value is T {
	return Boolean(value);
}
