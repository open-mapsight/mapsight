import type {IconColors, IconSpec} from "./icon-id.ts";

export type RequiredIconColors = Required<IconColors>;
export type ResolvedIconSpec = Required<Pick<IconSpec, "variant">> &
	IconSpec & {
		colors: RequiredIconColors;
	};
export declare const RUNTIME_ICON_PIXEL_RATIO = 2;
export declare function resolveSpec(spec: IconSpec): ResolvedIconSpec;
//# sourceMappingURL=resolve.d.ts.map
