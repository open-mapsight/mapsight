import type {AnyAction, Reducer} from "@reduxjs/toolkit";
import isPlainObject from "lodash/isPlainObject";
import merge from "lodash/merge";
import mergeWith from "lodash/mergeWith";

function isPlainStateObject(value: unknown): boolean {
	return (
		isPlainObject(value) &&
		Object.getPrototypeOf(value) === Object.prototype
	);
}

function hasSameOwnValues(previous: unknown, next: object): boolean {
	if (previous === null || typeof previous !== "object") {
		return false;
	}
	const keys = Object.keys(next);
	return (
		(!Array.isArray(previous) ||
			(Array.isArray(next) && previous.length === next.length)) &&
		keys.length === Object.keys(previous).length &&
		keys.every(
			(key) =>
				Object.hasOwn(previous, key) &&
				Object.is(
					(previous as Record<string, unknown>)[key],
					(next as Record<string, unknown>)[key],
				),
		)
	);
}

/**
 * Merge JSON-style config without copying branches omitted from the update.
 * Lodash still handles keys, array indices and undefined values. Only matching
 * plain-object/array branches use structural sharing; other types use the
 * existing merge behavior. Cyclic config updates are not supported.
 */
function mergeConfig(
	state: unknown,
	value: unknown,
	ancestors: Set<object>,
): unknown {
	if (
		(state !== undefined &&
			!Array.isArray(state) &&
			!isPlainStateObject(state)) ||
		(value !== null &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			!isPlainObject(value))
	) {
		return merge(Array.isArray(state) ? [] : {}, state, value);
	}
	if (value !== null && typeof value === "object") {
		if (ancestors.has(value)) {
			throw new TypeError("Cannot merge cyclic Mapsight config");
		}
		ancestors.add(value);
	}

	// Make a shallow copy using lodash's own enumerable-key/array rules. In
	// particular, a source's loaded data is retained when config omits it.
	const result: object = mergeWith(
		Array.isArray(state) ? [] : {},
		state,
		(_previous: unknown, current: unknown) => current,
	);
	mergeWith(result, value, (previous: unknown, incoming: unknown) => {
		if (previous === incoming) {
			return previous;
		}
		if (
			(Array.isArray(incoming) &&
				(previous === undefined || Array.isArray(previous))) ||
			(isPlainObject(incoming) &&
				(previous === undefined || isPlainStateObject(previous)))
		) {
			return mergeConfig(
				previous ?? (Array.isArray(incoming) ? [] : {}),
				incoming,
				ancestors,
			);
		}
		if (incoming !== null && typeof incoming === "object") {
			// Preserve lodash's conversions for mismatched containers and values
			// such as dates, typed arrays and class instances.
			return merge({}, {value: previous}, {value: incoming}).value;
		}
		return undefined;
	});

	if (value !== null && typeof value === "object") {
		ancestors.delete(value);
	}
	return hasSameOwnValues(state, result) ? state : result;
}

const mergeConfigReducer: Reducer = (state: unknown, action: AnyAction) =>
	mergeConfig(state, action.value, new Set());

export default mergeConfigReducer;
