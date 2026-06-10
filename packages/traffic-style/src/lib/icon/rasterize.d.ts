/** Rasterize the SVG at the target pixel size so vectors stay crisp (not upscaled). */
export declare function prepareSvgForRasterization(
	svg: string,
	pixelWidth: number,
	pixelHeight: number,
): string;
export declare function rasterizeSvg(
	svg: string,
	logicalWidth: number,
	logicalHeight: number,
	pixelRatio?: number,
): Promise<{
	dataUrl: string;
	width: number;
	height: number;
}>;
//# sourceMappingURL=rasterize.d.ts.map
