import type {AsyncStatusView} from "./types";

export function deriveAsyncFlags(view: AsyncStatusView): {
	isLoading: boolean;
	isRefetching: boolean;
	isPaused: boolean;
	hasData: boolean;
} {
	const isLoading =
		view.status === "pending" && view.fetchStatus === "fetching";
	const isRefetching =
		view.fetchStatus === "fetching" && view.status !== "pending";
	const isPaused = view.fetchStatus === "paused";
	const hasData = view.data != null && !defaultHasNoData(view.data);

	return {isLoading, isRefetching, isPaused, hasData};
}

function defaultHasNoData(data: unknown): boolean {
	if (Array.isArray(data)) {
		return data.length === 0;
	}
	if (typeof data === "object" && data !== null && "features" in data) {
		const features = (data as {features?: unknown}).features;
		return !Array.isArray(features) || features.length === 0;
	}
	return false;
}
