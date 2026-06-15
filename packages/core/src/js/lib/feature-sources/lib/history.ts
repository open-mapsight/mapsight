import {ensureNonNullable} from "@mapsight/lib-js/nonNullable";

import {getSourceDataHistory} from "@/lib/feature-sources/selectors";
import type {
	FeatureSourceDataSnapshot,
	FeatureSourceState,
} from "@/lib/feature-sources/types";

export type FeatureSourceDataHistory = {
	past: FeatureSourceDataSnapshot[];
	future: FeatureSourceDataSnapshot[];
};

function createSourceDataSnapshot(
	source: FeatureSourceState,
): FeatureSourceDataSnapshot {
	return {
		data: source.data || {features: []},
		lastActionType: source.lastActionType || null,
		lastUpdate: source.lastUpdate || null,
	};
}

export function undoChange(
	source: FeatureSourceState,
): Partial<FeatureSourceState> {
	const snapshot = createSourceDataSnapshot(source);
	const {past, future} = getSourceDataHistory(source);
	const nextPresent = ensureNonNullable(past[past.length - 1]);

	return {
		dataHistory: {
			past: past.slice(0, past.length - 1),
			future: [snapshot, ...future],
		},
		data: nextPresent.data,
		lastActionType: nextPresent.lastActionType,
		lastUpdate: nextPresent.lastUpdate,
	};
}

export function redoChange(
	source: FeatureSourceState,
): Partial<FeatureSourceState> {
	const snapshot = createSourceDataSnapshot(source);
	const {past, future} = getSourceDataHistory(source);
	const [nextPresent, ...nextFuture] = future;

	return {
		dataHistory: {
			past: [...past, snapshot],
			future: nextFuture,
		},
		data: nextPresent?.data,
		lastActionType: nextPresent?.lastActionType,
		lastUpdate: nextPresent?.lastUpdate,
	};
}

export function nextDataHistory(
	featureSourceState: FeatureSourceState,
): FeatureSourceDataHistory {
	const oldDataHistory = getSourceDataHistory(featureSourceState);
	const past = [
		...oldDataHistory.past,
		createSourceDataSnapshot(featureSourceState),
	];

	return {
		...oldDataHistory,
		past:
			featureSourceState.historyLimit === undefined
				? past
				: past.slice(-featureSourceState.historyLimit),
	};
}
