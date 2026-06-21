import type {
	FullUiState,
	MapsightUiFeature,
	MapsightUiFeatureId,
	SelectFeatureActionOptions,
} from "../../types";

export type SelectFeatureHandler = (
	featureId: MapsightUiFeatureId,
	options?: SelectFeatureActionOptions,
) => void;

export type ListSelectOnClick = FullUiState["list"]["selectOnClick"];

export type FeatureListItemDistanceLabelProps = {
	feature: MapsightUiFeature;
};

export type FeatureListItemInteractionProps = {
	selectFeature?: SelectFeatureHandler;
	deselectFeatures?: SelectFeatureHandler;
};
