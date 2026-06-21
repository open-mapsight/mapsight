import {useMemo} from "react";

import {deriveAsyncFlags} from "./derive-flags";
import {resolveAsyncStatusDisplay} from "./resolve-display-phase";
import type {
	AsyncStatusDisplayOptions,
	AsyncStatusDisplayResult,
	AsyncStatusView,
} from "./types";
import {useDelayedShow} from "./use-delayed-show";

export function useAsyncStatusDisplay<T>(
	view: AsyncStatusView<T>,
	options?: AsyncStatusDisplayOptions,
): AsyncStatusDisplayResult {
	const {isLoading} = deriveAsyncFlags(view);
	const showInitialLoading = useDelayedShow(isLoading, {
		delayMs: options?.delayMs,
		minVisibleMs: options?.minVisibleMs,
	});

	return useMemo(
		() => resolveAsyncStatusDisplay(view, showInitialLoading, options),
		[view, showInitialLoading, options],
	);
}
