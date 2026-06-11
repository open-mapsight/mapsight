import {trafficStylePictograms} from "../../generated/pictograms/traffic-style.ts";
import {registerPictograms} from "./registry.ts";

registerPictograms(trafficStylePictograms);

export type {
	PictogramDefinition,
	PictogramPack,
	PictogramSource,
} from "./types.ts";
export {pictogramPackForIconId} from "./types.ts";
export {
	getPictogram,
	getPictograms,
	hasPictogram,
	listPictogramIds,
	listPictogramIdsBySource,
	registerPictograms,
} from "./registry.ts";
