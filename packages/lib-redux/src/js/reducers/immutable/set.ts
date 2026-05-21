import type {AnyAction, Reducer} from "@reduxjs/toolkit";

const setReducer: Reducer = (state, action: AnyAction): unknown => action.value;

export default setReducer;
