import ImageSource from "ol/source/Image";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof ImageSource;

export default {
	type: "ImageSource",
	Constructor: ImageSource,
	optionMap: {...base.optionMap},
	initialOptionMap: {...base.initialOptionMap},
} satisfies Definition<Ctor>;
