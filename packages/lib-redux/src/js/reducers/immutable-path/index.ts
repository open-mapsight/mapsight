import type {Reducer} from "@reduxjs/toolkit";

import addTo from "./add-to";
import merge from "./merge";
import noop from "./noop";
import removeFrom from "./remove-from";
import set from "./set";

const reducers = {
	addTo: addTo,
	merge: merge,
	noop: noop,
	removeFrom: removeFrom,
	set: set,
} satisfies Record<string, Reducer>;

export default reducers;
