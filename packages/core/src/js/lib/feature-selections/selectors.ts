import type {FeatureId, State} from "@/types";

export type FeatureSelectionState = {
	features: Array<FeatureId>;
	max?: number;
};

export type FeatureSelectionId = string;

export type FeatureSelectionsState = Record<
	FeatureSelectionId,
	FeatureSelectionState
>;

function filter({features = [], max}: FeatureSelectionState) {
	if (max) {
		features = features.slice(0, max);
	}

	return features;
}

export function getFilteredFeatures(featureSelection?: FeatureSelectionState) {
	return featureSelection && filter(featureSelection);
}

export const createFeatureSelectionSelector =
	(controllerName: string, selectionId: string) => (state: State) => {
		const selections = state[controllerName] as
			undefined | FeatureSelectionsState;
		return selections?.[selectionId];
	};

export const createAllFeatureIdsSelector =
	(controllerName: string, selectionId: string) => (state: State) => {
		const selections = state[controllerName] as
			undefined | FeatureSelectionsState;
		return selections?.[selectionId]?.features ?? [];
	};
