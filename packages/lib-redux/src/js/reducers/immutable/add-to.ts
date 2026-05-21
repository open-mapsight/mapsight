import type {Reducer} from "@reduxjs/toolkit";

const addTo: Reducer<Array<unknown>> = (state, action) =>
	(state || []).concat([action.element]);

export default addTo;
