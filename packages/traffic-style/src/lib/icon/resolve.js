const DEFAULT_COLORS = {
	background: "#ffffff",
	foreground: "#000000",
};
export const RUNTIME_ICON_PIXEL_RATIO = 2;
export function resolveSpec(spec) {
	return {
		...spec,
		variant: spec.variant ?? "default",
		colors: {
			...DEFAULT_COLORS,
			...spec.colors,
		},
	};
}
//# sourceMappingURL=resolve.js.map
