import type {IconColors, IconSpec} from "./icon-id.ts";

export type RequiredIconColors = Required<IconColors>;

export type ResolvedIconSpec = Required<Pick<IconSpec, "variant">> &
	IconSpec & {
		colors: RequiredIconColors;
	};

const DEFAULT_COLORS: RequiredIconColors = {
	background: "#ffffff",
	foreground: "#000000",
};

export const RUNTIME_ICON_PIXEL_RATIO = 2;

export function resolveSpec(spec: IconSpec): ResolvedIconSpec {
	return {
		...spec,
		variant: spec.variant ?? "default",
		colors: {
			...DEFAULT_COLORS,
			...spec.colors,
		},
	};
}
