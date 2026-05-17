import setWith from "lodash/setWith";

function shallowCloneObject<T>(o: T): T {
	return {...o};
}

/**
 * Creates a new state from {state} with the value at the {path} changed to the given {value} and
 * reassigns all objects down along the path of the change so they aren't strictly equal anymore
 * and can be easily observed as changed by redux/react.
 *
 * **Note:** Returns a new state object! Does NOT mutate the original state object!
 *
 * @param {object} state The original state
 * @param {*[]|string} [path] The path at which the change gets applied.
 * @param {*} [value] The new value to be set (or undefined).
 * @returns {*} The new state with changed value and new objects along the path.
 */
export default function deepChangeState<State = unknown, Value = unknown>(
	state: State,
	path: Array<string>,
	value: Value,
) {
	const hasPath = path?.length;
	if (!hasPath) {
		return value;
	}

	const newState = shallowCloneObject(state);

	if (newState && typeof newState === "object") {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		setWith(newState, path, value, shallowCloneObject);
	}

	return newState;
}
