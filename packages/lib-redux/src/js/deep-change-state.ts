import setWith from "lodash/setWith";

/**
 * Shallow copy of a state node. Arrays stay arrays: an object spread would turn
 * an array on the path into a plain object keyed by its indexes.
 */
function shallowCloneNode<T>(o: T): T {
	return (Array.isArray(o) ? [...o] : {...o}) as T;
}

/**
 * Creates a new state from {state} with the value at the {path} changed to the given {value} and
 * reassigns all objects down along the path of the change so they aren't strictly equal anymore
 * and can be easily observed as changed by redux/react.
 *
 * Arrays along the path are copied as arrays, missing ancestors are created as plain objects.
 *
 * **Note:** Returns a new state object! Does NOT mutate the original state object!
 *
 * @param {object} state The original state
 * @param {Array<string|number>} [path] The path at which the change gets applied.
 * @param {*} [value] The new value to be set (or undefined).
 * @returns {*} The new state with changed value and new objects along the path.
 */
export default function deepChangeState<State = unknown, Value = unknown>(
	state: State,
	path: Array<string | number>,
	value: Value,
) {
	const hasPath = path?.length;
	if (!hasPath) {
		return value;
	}

	const newState = shallowCloneNode(state);

	if (newState && typeof newState === "object") {
		setWith(newState, path, value, shallowCloneNode);
	}

	return newState;
}
