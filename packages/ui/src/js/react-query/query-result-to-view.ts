import type {UseQueryResult} from "@tanstack/react-query";

import type {AsyncStatusView} from "../lib/async-status/types";

export function queryResultToView<T>(
	query: UseQueryResult<T>,
): AsyncStatusView<T> {
	return {
		status: query.status,
		fetchStatus: query.fetchStatus,
		data: query.data,
		error: query.error,
		isPlaceholderData: query.isPlaceholderData,
		refetch: query.refetch
			? () => {
					void query.refetch();
				}
			: undefined,
	};
}
