import type {Reducer} from "@reduxjs/toolkit";

const noopReducer: Reducer = <T>(state: T): T => state;

export default noopReducer;
