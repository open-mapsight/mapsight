import type {AnyAction} from "@reduxjs/toolkit";

function shallowCloneObject<T>(o: T): T {
	return {...o};
}

/**
 * Creates a new action (object or function) with the same content but new reference.
 *
 * @param action action
 * @returns cloned action
 */
export default function cloneAction<T = AnyAction>(action: T): T {
	// special case for redux-thunk where the action is a function
	if (typeof action === "function") {
		const newAction: T = action.bind({}) as T;

		if ("meta" in action) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			newAction.meta = shallowCloneObject(action.meta);
		}

		if (action.name) {
			Object.defineProperty(newAction, "name", {
				value: action.name + "__cloned",
			});
		}

		return newAction;
	}

	// otherwise just make a shallow copy of the plan object action
	return shallowCloneObject(action);
}
