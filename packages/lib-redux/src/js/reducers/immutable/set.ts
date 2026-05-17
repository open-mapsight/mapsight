import {AnyAction, Reducer} from "redux";

const setReducer: Reducer = (state, action: AnyAction): unknown => action.value;

export default setReducer;
