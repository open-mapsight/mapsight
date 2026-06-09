export const FeatureInteractionNames = [
	"mousedown",
	"mouseover",
	"touch",
] as const;

export type FeatureInteractionName = (typeof FeatureInteractionNames)[number];
