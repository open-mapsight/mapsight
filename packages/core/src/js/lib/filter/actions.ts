import {merge} from "../base/actions";

export const mergeFilterOptions = (
	controllerName: string,
	options: unknown = {},
) => merge([controllerName, "options"], options);
