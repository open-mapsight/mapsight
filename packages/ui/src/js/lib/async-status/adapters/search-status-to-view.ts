import type {AsyncStatusView} from "../types";

export const SEARCH_STATUS_INACTIVE = "inactive";
export const SEARCH_STATUS_EMPTY = "empty";
export const SEARCH_STATUS_FOUND = "found";
export const SEARCH_STATUS_LOADING = "loading";
export const SEARCH_STATUS_ERROR = "error";

export type SearchStatus =
	| typeof SEARCH_STATUS_INACTIVE
	| typeof SEARCH_STATUS_EMPTY
	| typeof SEARCH_STATUS_FOUND
	| typeof SEARCH_STATUS_LOADING
	| typeof SEARCH_STATUS_ERROR;

export function searchStatusToView<T>(
	status: SearchStatus,
	data: T[] | undefined,
): AsyncStatusView<T[]> {
	switch (status) {
		case SEARCH_STATUS_INACTIVE:
			return {
				status: "success",
				fetchStatus: "idle",
				data: undefined,
				error: undefined,
			};
		case SEARCH_STATUS_LOADING:
			return {
				status: data?.length ? "success" : "pending",
				fetchStatus: "fetching",
				data,
				error: undefined,
			};
		case SEARCH_STATUS_ERROR:
			return {
				status: "error",
				fetchStatus: "idle",
				data,
				error: true,
			};
		case SEARCH_STATUS_EMPTY:
			return {
				status: "success",
				fetchStatus: "idle",
				data: [],
				error: undefined,
			};
		case SEARCH_STATUS_FOUND:
			return {
				status: "success",
				fetchStatus: "idle",
				data,
				error: undefined,
			};
	}
}
