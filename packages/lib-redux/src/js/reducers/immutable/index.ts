import {Reducer} from "redux";

import addTo from "./add-to";
import merge from "./merge";
import noop from "./noop";
import removeFrom from "./remove-from";
import set from "./set";

const reducers: Record<string, Reducer> = {
	addTo: addTo,
	merge: merge,
	noop: noop,
	removeFrom: removeFrom,
	set: set,
};

export default reducers;
