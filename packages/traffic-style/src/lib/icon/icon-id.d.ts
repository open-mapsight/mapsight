export type IconVariant = "default" | "small" | "xsmall" | "plain";
export type IconColors = {
	background?: string;
	foreground?: string;
};
export type IconSpec = {
	variant?: IconVariant;
	pictogram?: string;
	label?: string;
	colors?: IconColors;
};
/** Parse a compact `mapsightIconId` value into an IconSpec. */
export declare function parseMapsightIcon(value: string): IconSpec | null;
/** Serialize an IconSpec to the compact `mapsightIconId` form. */
export declare function formatMapsightIcon(spec: IconSpec): string;
/** Resolve a compact id + variant to the internal render spec. */
export declare function resolveMapsightIconSpec(
	mapsightIconId: string,
	variant?: IconVariant,
): IconSpec | null;
//# sourceMappingURL=icon-id.d.ts.map
