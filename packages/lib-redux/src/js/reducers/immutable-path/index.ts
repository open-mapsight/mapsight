import type {Reducer} from "@reduxjs/toolkit";

import addTo from "./add-to";
import merge from "./merge";
import mergeConfig from "./merge-config";
import noop from "./noop";
import removeFrom from "./remove-from";
import set from "./set";

const reducers = {
	addTo: addTo,
	merge: merge,
	mergeConfig: mergeConfig,
	noop: noop,
	removeFrom: removeFrom,
	set: set,
} satisfies Record<string, Reducer>;

export default reducers;
