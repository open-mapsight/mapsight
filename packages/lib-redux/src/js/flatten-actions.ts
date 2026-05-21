import type {AnyAction} from "@reduxjs/toolkit";

/**
 * Flattens (deeply) batched actions into a flat array of actions
 *
 * @param {object} action the root action
 * @returns {Array<object>} flattened array of actions
 */
export default function flattenActions(action: AnyAction): Array<AnyAction> {
	if (
		"meta" in action &&
		"payload" in action &&
		Array.isArray(action.payload) &&
		typeof action.meta === "object" &&
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		action.meta.batch === true
	) {
		return action.payload.flatMap(flattenActions);
	}

	return [action];
}
