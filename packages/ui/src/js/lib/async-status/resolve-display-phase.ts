import {deriveAsyncFlags} from "./derive-flags";
import type {
	AsyncStatusDisplayOptions,
	AsyncStatusDisplayPhase,
	AsyncStatusDisplayResult,
	AsyncStatusView,
} from "./types";
import {DEFAULT_ASYNC_STATUS_OPTIONS, defaultIsEmpty} from "./types";

export function resolveAsyncStatusDisplay(
	view: AsyncStatusView,
	showInitialLoading: boolean,
	options?: AsyncStatusDisplayOptions,
): AsyncStatusDisplayResult {
	const errorWithStaleData =
		options?.errorWithStaleData ??
		DEFAULT_ASYNC_STATUS_OPTIONS.errorWithStaleData;
	const showRefreshIndicator =
		options?.showRefreshIndicator ??
		DEFAULT_ASYNC_STATUS_OPTIONS.showRefreshIndicator;
	const isEmptyCheck = options?.isEmpty ?? defaultIsEmpty;

	const {isLoading, isRefetching, isPaused, hasData} = deriveAsyncFlags(view);
	const showError = view.status === "error";
	const isEmpty = view.status === "success" && isEmptyCheck(view.data);

	let phase: AsyncStatusDisplayPhase;

	// Priority order matters for error + stale data and loading delay.
	if (showError && !hasData) {
		phase = "error";
	} else if (showError && hasData && errorWithStaleData === "banner") {
		phase = "refreshing";
	} else if (showError && hasData && errorWithStaleData === "replace") {
		phase = "error";
	} else if (showInitialLoading) {
		phase = "loading";
	} else if (isLoading) {
		phase = "hidden";
	} else if (isRefetching && showRefreshIndicator) {
		phase = "refreshing";
	} else if (isEmpty) {
		phase = "empty";
	} else {
		phase = "content";
	}

	return {
		phase,
		showInitialLoading,
		showRefreshing: isRefetching && showRefreshIndicator,
		showError,
		isLoading,
		isRefetching,
		isPaused,
	};
}

export function getAsyncStatusDisplayOptions(
	options?: AsyncStatusDisplayOptions,
): Required<
	Pick<
		AsyncStatusDisplayOptions,
		| "delayMs"
		| "minVisibleMs"
		| "errorWithStaleData"
		| "showRefreshIndicator"
	>
> & {
	isEmpty: (data: unknown) => boolean;
} {
	return {
		delayMs: options?.delayMs ?? DEFAULT_ASYNC_STATUS_OPTIONS.delayMs,
		minVisibleMs:
			options?.minVisibleMs ?? DEFAULT_ASYNC_STATUS_OPTIONS.minVisibleMs,
		errorWithStaleData:
			options?.errorWithStaleData ??
			DEFAULT_ASYNC_STATUS_OPTIONS.errorWithStaleData,
		showRefreshIndicator:
			options?.showRefreshIndicator ??
			DEFAULT_ASYNC_STATUS_OPTIONS.showRefreshIndicator,
		isEmpty: options?.isEmpty ?? defaultIsEmpty,
	};
}
