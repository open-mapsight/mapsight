import type {FeatureSourceState} from "@mapsight/core/lib/feature-sources/types";

import type {AsyncStatusView} from "../types";

export function featureSourceToView(
	source: FeatureSourceState | undefined,
	options?: {refetch?: () => void; enabled?: boolean},
): AsyncStatusView<FeatureSourceState["data"]> {
	if (options?.enabled === false) {
		return {
			status: "success",
			fetchStatus: "idle",
			data: undefined,
			error: undefined,
		};
	}

	if (!source) {
		return {
			status: "pending",
			fetchStatus: "fetching",
			data: undefined,
			error: undefined,
			refetch: options?.refetch,
		};
	}

	const data = source.data ?? undefined;
	const hasData = data != null;

	if (source.error) {
		return {
			status: "error",
			fetchStatus: source.isLoading ? "fetching" : "idle",
			data,
			error: source.error,
			refetch: options?.refetch,
		};
	}

	if (source.refreshPaused) {
		return {
			status: hasData ? "success" : "pending",
			fetchStatus: "paused",
			data,
			error: undefined,
			refetch: options?.refetch,
		};
	}

	if (source.isLoading) {
		return {
			status: hasData ? "success" : "pending",
			fetchStatus: "fetching",
			data,
			error: undefined,
			refetch: options?.refetch,
		};
	}

	return {
		status: "success",
		fetchStatus: "idle",
		data,
		error: undefined,
		refetch: options?.refetch,
	};
}
