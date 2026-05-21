import type {AnyAction, Reducer} from "@reduxjs/toolkit";

const removeFromReducer: Reducer = <T extends Array<unknown>>(
	state: T,
	action: AnyAction,
) => state.filter((element) => element !== action.element);

export default removeFromReducer;
