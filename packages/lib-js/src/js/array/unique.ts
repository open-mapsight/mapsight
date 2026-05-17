/**
 * Fast, type-safe uniqueness for primitives (strings, numbers, etc.)
 */
export default function unique<T>(array: T[]): T[] {
	return [...new Set(array)];
}
