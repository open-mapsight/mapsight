import {fontAwesomePictograms} from "../../generated/pictograms/fontawesome.ts";
import {registerPictograms} from "./registry.ts";

registerPictograms(fontAwesomePictograms);

export {fontAwesomePictograms};
export type {
	PictogramDefinition,
	PictogramPack,
	PictogramSource,
} from "./types.ts";
