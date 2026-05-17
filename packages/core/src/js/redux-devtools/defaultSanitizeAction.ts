import type {EnhancerOptions} from "@redux-devtools/extension";

import type {Action} from "@/types";

import getSanitizedActionType from "./sanitizeActionType";

const defaultSanitizeAction: EnhancerOptions["actionSanitizer"] = <
	A extends Action = Action,
>(
	action: A,
	_id: number,
): A => {
	if (!action.meta?.sanitized) {
		// NOTE: We need to create a copy and not just modify the action
		//       as it may be reused.
		return {
			...action,
			meta: {
				...(action.meta || {}),
				sanitized: true,
			},
			type: getSanitizedActionType(action),
			_type: action.type,
		};
	}

	return action;
};
export default defaultSanitizeAction;
