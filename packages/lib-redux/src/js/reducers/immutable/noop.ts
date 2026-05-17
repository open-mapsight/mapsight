import {Reducer} from "redux";

const noopReducer: Reducer = <T>(state: T): T => state;

export default noopReducer;
