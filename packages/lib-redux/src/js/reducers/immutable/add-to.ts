import {Reducer} from "redux";

const addTo: Reducer<Array<unknown>> = (state, action) =>
	(state || []).concat([action.element]);

export default addTo;
