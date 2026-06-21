export type AsyncFetchStatus = "fetching" | "paused" | "idle";

export type AsyncStatusView<T = unknown> = {
	status: "pending" | "error" | "success";
	fetchStatus: AsyncFetchStatus;
	data: T | undefined;
	error: unknown;
	isPlaceholderData?: boolean;
	refetch?: () => void;
};

export type AsyncStatusDisplayOptions = {
	/** Delay before showing initial loading UI. Default: 300 */
	delayMs?: number;
	/** Minimum time loading UI stays visible once shown. Default: 200 */
	minVisibleMs?: number;
	/** When error occurs but stale data exists. Default: "banner" */
	errorWithStaleData?: "banner" | "replace";
	/** Show subtle indicator during refetch. Default: true */
	showRefreshIndicator?: boolean;
	isEmpty?: (data: unknown) => boolean;
};

export type AsyncStatusDisplayPhase =
	| "hidden"
	| "loading"
	| "error"
	| "empty"
	| "refreshing"
	| "content";

export type AsyncStatusDisplayResult = {
	phase: AsyncStatusDisplayPhase;
	showInitialLoading: boolean;
	showRefreshing: boolean;
	showError: boolean;
	isLoading: boolean;
	isRefetching: boolean;
	isPaused: boolean;
};

export const DEFAULT_ASYNC_STATUS_OPTIONS = {
	delayMs: 300,
	minVisibleMs: 200,
	showRefreshIndicator: true,
	errorWithStaleData: "banner" as const,
};

export function defaultIsEmpty(data: unknown): boolean {
	if (data == null) {
		return true;
	}
	if (Array.isArray(data)) {
		return data.length === 0;
	}
	if (typeof data === "object" && "features" in data) {
		const features = (data as {features?: unknown}).features;
		return !Array.isArray(features) || features.length === 0;
	}
	return false;
}
