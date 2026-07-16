import type {Coordinate} from "ol/coordinate";
import type {Type as GeometryType} from "ol/geom/Geometry";
import type Image from "ol/style/Image";
import type Style from "ol/style/Style";

import type {Derivation} from "./geometry/deriveGeometriesFromBase";

export type StyleLiteral = {
	[styleKey: string]: number | boolean | string | Style | null;
} & {
	image?: Image | null;
	anchor?: Array<number>;
	size?: Array<number>;
	imgSize?: Array<number>;
	offset?: Array<number>;
	color?: [number, number, number, number];
	lineDash?: Array<number>;
};

export type UnitStyleValue = `${string}px` | `${string}%` | null;
export type BoolishStyleValue =
	boolean | 1 | 0 | "1" | "0" | "true" | "false" | null;

export type NumberArrayStyleValue = Array<string | number> | string;
export type NoneAble<T> = "unset" | "none" | T;

export type StyleType = "circle" | "icon" | "stroke" | "fill" | "text";

export type StyleValues = Record<string, {value: string | number}>;
export type NoneAbleStyleValues = {value?: "none" | "unset"} | StyleValues;

export type StyleDeclaration =
	NoneAbleStyleValues | Partial<Record<StyleType, NoneAbleStyleValues>>;

export type RootStyleDeclaration = {
	display?: {value: "none"};
	image?: {type: {value: "icon" | "circle"}};
	geometry?: {value: GeometryType | Derivation};
	zIndex?: {value: number};
} & Partial<Record<StyleType, StyleDeclaration>>;

export type GroupedRootStyleDeclaration = Record<string, RootStyleDeclaration>;

export type Padding = [number, number, number, number];

export type Resolution = number;

export type Vertex = [Coordinate, number];

export type VERTICES_FILTER = "all" | "first" | "start" | "last" | "end";

export type INTERMEDIATE_FILTER = "all" | "intermediate";

export type RING_FILTER = "all" | "inner" | "outer";
