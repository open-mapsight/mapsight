import {
	ASYNC_ACTION_FLAG,
	CONTROLLED_ACTION_FLAG,
	isBatchedAction,
} from "@/lib/base/actions";
import type {ActionOrThunk} from "@/types";

export default function getSanitizedActionType(action: ActionOrThunk): string {
	let sanitizedActionType: string;

	const isThunk = typeof action === "function";
	if (isThunk) {
		sanitizedActionType = action.name ? `thunk<${action.name}>` : "thunk";
	} else if (typeof action === "object" && action.type) {
		sanitizedActionType = action.type;
	} else {
		sanitizedActionType = "unknown action type [" + typeof action + "] ❗";
	}

	sanitizedActionType = sanitizedActionType.replace(/MAPSIGHT_/g, "🗺️ ");

	if (action.meta?.[ASYNC_ACTION_FLAG]) {
		sanitizedActionType += " ⏱️";
	}

	if (!isThunk) {
		if (action.meta?.[CONTROLLED_ACTION_FLAG]) {
			sanitizedActionType += " 🔖️";
		}

		if (isBatchedAction(action)) {
			return `[ ${action.payload
				.map(getSanitizedActionType)
				.join(", ")} ]`;
		}

		if (action.meta?.path) {
			sanitizedActionType += " | " + action.meta.path.join(".");
		}
	}

	return sanitizedActionType;
}
