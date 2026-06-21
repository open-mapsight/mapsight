import type {FeatureSourceState} from "@mapsight/core/lib/feature-sources/types";

import type {AsyncStatusView} from "../types";

export type FeatureSourceToViewOptions = {
	refetch?: () => void;
	enabled?: boolean;
	/** Member sources when `source.type` is `"combined"`. */
	memberSources?: Array<FeatureSourceState | undefined>;
};

function isCombinedMemberUnsettled(
	member: FeatureSourceState | undefined,
): boolean {
	if (!member) {
		return true;
	}
	if (member.error) {
		return false;
	}
	if (member.isLoading) {
		return true;
	}
	return member.data == null;
}

function combinedFeatureSourceToView(
	source: FeatureSourceState,
	data: FeatureSourceState["data"] | undefined,
	memberSources: Array<FeatureSourceState | undefined>,
	options?: Pick<FeatureSourceToViewOptions, "refetch">,
): AsyncStatusView<FeatureSourceState["data"]> | null {
	if (source.type !== "combined" || !memberSources.length) {
		return null;
	}

	const hasFeatures = (data?.features?.length ?? 0) > 0;
	const anyUnsettled = memberSources.some(isCombinedMemberUnsettled);
	const anyLoading = memberSources.some((member) => member?.isLoading);
	const isFetching = anyUnsettled || anyLoading;
	const firstError = memberSources.find((member) => member?.error)?.error;

	if (firstError && !hasFeatures) {
		return {
			status: "error",
			fetchStatus: anyLoading ? "fetching" : "idle",
			data,
			error: firstError,
			refetch: options?.refetch,
		};
	}

	if (isFetching && !hasFeatures) {
		return {
			status: "pending",
			fetchStatus: "fetching",
			data: undefined,
			error: undefined,
			refetch: options?.refetch,
		};
	}

	if (isFetching && hasFeatures) {
		return {
			status: "success",
			fetchStatus: "fetching",
			data,
			error: undefined,
			refetch: options?.refetch,
		};
	}

	return null;
}

export function featureSourceToView(
	source: FeatureSourceState | undefined,
	options?: FeatureSourceToViewOptions,
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

	const combinedView =
		options?.memberSources &&
		combinedFeatureSourceToView(
			source,
			data,
			options.memberSources,
			options,
		);

	if (combinedView) {
		return combinedView;
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
