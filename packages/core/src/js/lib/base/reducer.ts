import type {Reducer} from "@reduxjs/toolkit";

import reducers from "@mapsight/lib-redux/reducers/immutable-path";

import type {Action, State} from "@/types";

export const ACTION_NOOP = "MAPSIGHT_NOOP";
export const ACTION_SET = "MAPSIGHT_SET";
export const ACTION_ADD_TO = "MAPSIGHT_ADD_TO";
export const ACTION_MERGE = "MAPSIGHT_MERGE";
export const ACTION_REMOVE_FROM = "MAPSIGHT_REMOVE_FROM";

const reducerMap: Record<string, Reducer> = {
	[ACTION_NOOP]: reducers.noop,
	[ACTION_SET]: reducers.set,
	[ACTION_ADD_TO]: reducers.addTo,
	[ACTION_MERGE]: reducers.merge,
	[ACTION_REMOVE_FROM]: reducers.removeFrom,
};

export function baseReducer<TState = State, TAction extends Action = Action>(
	state: TState,
	action: TAction,
): TState {
	const reducer = (
		typeof action.type === "string"
			? (reducerMap[action.type] ?? reducers.noop)
			: reducers.noop
	) as Reducer<TState, TAction>;
	return reducer(state, action);
}
