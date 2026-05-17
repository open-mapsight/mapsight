import {AnyAction, Reducer} from "redux";

const removeFromReducer: Reducer = <T extends Array<unknown>>(
	state: T,
	action: AnyAction,
) => state.filter((element) => element !== action.element);

export default removeFromReducer;
