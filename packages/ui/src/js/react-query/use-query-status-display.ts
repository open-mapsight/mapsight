import type {UseQueryResult} from "@tanstack/react-query";

import type {AsyncStatusDisplayOptions} from "../lib/async-status/types";
import {useAsyncStatusDisplay} from "../lib/async-status/use-async-status-display";
import {queryResultToView} from "./query-result-to-view";

export function useQueryStatusDisplay<T>(
	query: UseQueryResult<T>,
	options?: AsyncStatusDisplayOptions,
) {
	return useAsyncStatusDisplay(queryResultToView(query), options);
}
