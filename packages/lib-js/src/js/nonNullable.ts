import getFunctionDisplayName from "./function/getFunctionDisplayName.ts";

export function isNonNullable<T>(val: null | undefined | void | T): val is T {
	return val !== null && val !== undefined;
}

export {isNonNullable as is};

export function assertNonNullable<T>(
	value: null | undefined | void | T,
	msg: string = "NonNullable assertion failure on value",
): asserts value is T {
	if (value === null || value === undefined) {
		throw new Error(msg);
	}
}

export {assertNonNullable as assert};

export function ensureNonNullable<T>(
	value: null | undefined | void | T,
	msg: string = "NonNullable assertion failure on value",
): T {
	if (value === null || value === undefined) {
		throw new Error(msg);
	}
	return value;
}

export {ensureNonNullable as ensure};

export function createUnwrapOr<U>(
	or: U,
): <T>(val: T | null | undefined | void) => T | U {
	function unwrapOr<T>(val: T | null | undefined | void): T | U {
		if (val !== null && val !== undefined) {
			return val;
		}
		return or;
	}
	return unwrapOr;
}

export type ExtractNullable<T> = Extract<T, null | undefined | void>;

export function mapNonNullable<T, U>(
	value: T,
	mapFn: (value: NonNullable<T>) => U,
): ExtractNullable<T> | U {
	if (value === null || value === undefined) {
		return value as unknown as U;
	}
	return mapFn(value);
}

export {mapNonNullable as map};

export function createMapNonNullable<T, U>(
	mapFn: (value: T) => U,
): <V extends T | null | undefined | void>(value: V) => ExtractNullable<V> | U {
	const createMapNonNullableInner = <V extends T | null | undefined | void>(
		value: V,
	): ExtractNullable<V> | U => {
		if (value === null || value === undefined) {
			return value as unknown as U;
		}
		return mapFn(value as T);
	};

	createMapNonNullableInner.displayName = `createMapNonNullable_${getFunctionDisplayName(
		mapFn,
	)}`;
	return createMapNonNullableInner;
}

export {createMapNonNullable as createMap};
